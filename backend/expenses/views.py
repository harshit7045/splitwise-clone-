from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Sum
from django.contrib.auth import get_user_model

from .models import Group, GroupMember, Expense, ExpenseSplit
from .serializers import (
    GroupSerializer, MemberSerializer, ExpenseSerializer, SettlementSerializer
)

User = get_user_model()

# --- Pagination Settings ---
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000

# ==========================================
# GROUP MANAGEMENT
# ==========================================

class GroupListCreateView(generics.ListCreateAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # List groups where the current user is a member
        return Group.objects.filter(members=self.request.user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                group = serializer.save(created_by=request.user)
                # Automatically add creator as a member
                GroupMember.objects.create(group=group, user=request.user)
                headers = self.get_success_headers(serializer.data)
                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class JoinGroupView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        _, created = GroupMember.objects.get_or_create(group=group, user=request.user)
        msg = "Joined group successfully" if created else "Already a member"
        return Response({"message": msg}, status=status.HTTP_200_OK)

class LeaveGroupView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        deleted, _ = GroupMember.objects.filter(group=group, user=request.user).delete()
        if deleted:
            return Response({"message": "Left group successfully"})
        return Response({"error": "You are not in this group"}, status=status.HTTP_400_BAD_REQUEST)

class GroupMembersView(generics.ListAPIView):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        group_id = self.kwargs['group_id']
        # SECURITY FIX: Only return members if the requester is ALSO in the group
        return User.objects.filter(
            joined_groups__id=group_id,
            joined_groups__members=self.request.user
        ).distinct()


# ==========================================
# EXPENSES & TRANSACTIONS
# ==========================================

class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        group_id = self.kwargs['group_id']
        # SECURITY FIX: Ensure the request.user is actually a member of this group
        return Expense.objects.filter(
            group_id=group_id, 
            group__members=self.request.user
        ).order_by('-created_at').prefetch_related('shares')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['group'] = get_object_or_404(Group, id=self.kwargs['group_id'])
        return context


# ==========================================
# SETTLEMENT & BALANCES
# ==========================================

class SettleUpView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        serializer = SettlementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payer = request.user
        recipient_id = serializer.validated_data['to_user_id']
        amount = serializer.validated_data['amount']
        group = get_object_or_404(Group, id=group_id)

        # SECURITY FIX: Ensure user matches group
        if not group.members.filter(id=request.user.id).exists():
            return Response({"error": "Not authorized to settle up in this group"}, status=status.HTTP_403_FORBIDDEN)

        recipient = get_object_or_404(User, id=recipient_id)

        # A Settlement is an Expense where Payer pays 100% of amount to Recipient
        with transaction.atomic():
            expense = Expense.objects.create(
                group=group,
                paid_by=payer,
                amount=amount,
                description="Settlement Payment",
                category='SETTLEMENT'
            )
            ExpenseSplit.objects.create(
                expense=expense,
                user=recipient,
                amount=amount
            )

        return Response({"message": f"Paid {amount} to {recipient.username}"}, status=status.HTTP_201_CREATED)


class GroupBalanceView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        # 1. Verification
        group = get_object_or_404(Group, id=group_id)
        if not group.members.filter(id=request.user.id).exists():
             return Response({"error": "Not a member"}, status=status.HTTP_403_FORBIDDEN)

        # 2. Optimized Calculation
        # Fetch all splits where the user PAID
        owed_to_me = ExpenseSplit.objects.filter(
            expense__group=group,
            expense__paid_by=request.user
        ).exclude(user=request.user).values('user__username', 'user__id', 'user__name').annotate(total=Sum('amount'))

        # Fetch all splits where the user OWES
        b_owe_them = ExpenseSplit.objects.filter(
            expense__group=group,
            user=request.user
        ).exclude(expense__paid_by=request.user).values('expense__paid_by__username', 'expense__paid_by__id', 'expense__paid_by__name').annotate(total=Sum('amount'))
        
        # Merge results in Python
        balances_map = {}

        for item in owed_to_me:
             uid = item['user__id']
             # FIX: Prefer Real Name, fallback to Username
             name = item['user__name'] or item['user__username'] 
             balances_map[uid] = {'name': name, 'amount': item['total']}

        for item in b_owe_them:
             uid = item['expense__paid_by__id']
             # FIX: Prefer Real Name, fallback to Username
             name = item['expense__paid_by__name'] or item['expense__paid_by__username']
             current = balances_map.get(uid, {'name': name, 'amount': 0})
             current['amount'] -= item['total']
             balances_map[uid] = current

        # Format
        final_balances = []
        for uid, data in balances_map.items():
             net = data['amount']
             if net != 0:
                 final_balances.append({
                     "user": data['name'],
                     "user_id": uid,
                     "amount": net,
                     "status": "You are owed" if net > 0 else "You owe"
                 })

        return Response(final_balances)

# --- NEW: Dashboard & Activity Views ---

class UserGlobalBalanceView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Calculate what I owe others
        i_owe = ExpenseSplit.objects.filter(
            user=request.user
        ).exclude(expense__paid_by=request.user).aggregate(Sum('amount'))['amount__sum'] or 0

        # Calculate what others owe me
        owed_to_me = ExpenseSplit.objects.filter(
            expense__paid_by=request.user
        ).exclude(user=request.user).aggregate(Sum('amount'))['amount__sum'] or 0

        return Response({
            "total_balance": owed_to_me - i_owe,
            "you_owe": i_owe,
            "owed_to_you": owed_to_me
        })

class UserActivityView(generics.ListAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Show expenses from all groups I am in, ordered by newest
        return Expense.objects.filter(
            group__members=self.request.user
        ).order_by('-created_at')

class GroupDetailView(generics.RetrieveAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        # SECURITY FIX: Only allow viewing groups I am a member of
        return Group.objects.filter(members=self.request.user)