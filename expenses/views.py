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
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# ==========================================
# GROUP MANAGEMENT
# ==========================================

class GroupCreateView(generics.CreateAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

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
        return User.objects.filter(joined_groups__id=group_id)


# ==========================================
# EXPENSES & TRANSACTIONS
# ==========================================

class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        group_id = self.kwargs['group_id']
        # Reverse order by date (Newest First)
        return Expense.objects.filter(group_id=group_id).order_by('-created_at').prefetch_related('shares')

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
        my_id = request.user.id
        # Get all other members
        members = User.objects.filter(joined_groups__id=group_id).exclude(id=my_id)
        balances = []
        
        for member in members:
            # How much I paid for THEM (They owe me)
            owed_to_me = ExpenseSplit.objects.filter(
                expense__group_id=group_id,
                expense__paid_by_id=my_id,
                user_id=member.id
            ).aggregate(Sum('amount'))['amount__sum'] or 0

            # How much THEY paid for ME (I owe them)
            i_owe_them = ExpenseSplit.objects.filter(
                expense__group_id=group_id,
                expense__paid_by_id=member.id, 
                user_id=my_id
            ).aggregate(Sum('amount'))['amount__sum'] or 0

            net_balance = owed_to_me - i_owe_them
            
            if net_balance != 0:
                balances.append({
                    "user": member.username,
                    "user_id": member.id,
                    "amount": net_balance,
                    "status": "You are owed" if net_balance > 0 else "You owe"
                })

        return Response(balances)