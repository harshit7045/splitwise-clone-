from django.db import models
from django.conf import settings

class Group(models.Model):
    name = models.CharField(max_length=100)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='created_groups'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    # FIX APPLIED HERE: Changed related_name from 'groups' to 'joined_groups'
    # to avoid conflict with the built-in User.groups permission field.
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='GroupMember',
        related_name='joined_groups' 
    )

    def __str__(self):
        return self.name

class GroupMember(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'user')
        
    def __str__(self):
        return f"{self.user.username} in {self.group.name}"

class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('EXPENSE', 'Expense'), 
        ('SETTLEMENT', 'Settlement')
    ]

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='expenses')
    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='expenses_paid'
    )
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='EXPENSE')
    
    # Optional: If this settlement is paying off a specific previous bill
    related_expense = models.ForeignKey(
        'self', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.description} - {self.amount}"

class ExpenseSplit(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='shares')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='expense_shares'
    )
    # Positive = You Owe, Negative = You are Owed (usually calculated in views)
    amount = models.DecimalField(max_digits=10, decimal_places=2) 

    def __str__(self):
        return f"{self.user.username} share in {self.expense.description}"