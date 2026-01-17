from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Group, GroupMember, Expense, ExpenseSplit

User = get_user_model()

# --- 1. Member Listing ---
class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'email']

# --- 2. Group Creation ---
class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name', 'created_by', 'created_at']
        read_only_fields = ['created_by', 'created_at']

# --- 3. Expense Splits (Nested) ---
class ExpenseSplitSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='user')
    user_name = serializers.ReadOnlyField(source='user.username') 

    class Meta:
        model = ExpenseSplit
        fields = ['user_id', 'user_name', 'amount']

# --- 4. Main Expense Logic ---
class ExpenseSerializer(serializers.ModelSerializer):
    paid_by_name = serializers.ReadOnlyField(source='paid_by.username')
    splits = ExpenseSplitSerializer(many=True, source='shares') 

    class Meta:
        model = Expense
        fields = ['id', 'description', 'amount', 'created_at', 'category', 'paid_by', 'paid_by_name', 'splits']
        read_only_fields = ['created_at', 'paid_by', 'category']

    def validate(self, data):
        """
        VALIDATION: Ensure Total Amount == Sum(Splits)
        """
        total_amount = data.get('amount')
        splits_data = data.get('shares')

        if not splits_data:
            raise serializers.ValidationError("You must provide at least one split.")

        sum_splits = sum(split['amount'] for split in splits_data)

        # Check for inequality (using a small epsilon is safer for floats, 
        # but for Decimal/Money strict equality is usually preferred in finance apps)
        if total_amount != sum_splits:
            raise serializers.ValidationError(
                f"Total amount ({total_amount}) does not match sum of splits ({sum_splits})."
            )

        return data

    def create(self, validated_data):
        splits_data = validated_data.pop('shares')
        group = self.context['group']
        paid_by = self.context['request'].user
        
        # Create the Expense
        expense = Expense.objects.create(group=group, paid_by=paid_by, **validated_data)

        # Create the Splits
        for split in splits_data:
            ExpenseSplit.objects.create(expense=expense, **split)
            
        return expense

# --- 5. Settlement Serializer ---
class SettlementSerializer(serializers.Serializer):
    to_user_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)