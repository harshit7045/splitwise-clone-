from django.urls import path
from .views import (
    GroupListCreateView, JoinGroupView, LeaveGroupView, GroupMembersView,
    ExpenseListCreateView, SettleUpView, GroupBalanceView
)

urlpatterns = [
    # Group Management
    path('groups/', GroupListCreateView.as_view(), name='group-list-create'),
    path('groups/<int:group_id>/join/', JoinGroupView.as_view(), name='join-group'),
    path('groups/<int:group_id>/leave/', LeaveGroupView.as_view(), name='leave-group'),
    path('groups/<int:group_id>/members/', GroupMembersView.as_view(), name='group-members'),

    # Transactions (Lists are paginated, Create has validation)
    path('groups/<int:group_id>/expenses/', ExpenseListCreateView.as_view(), name='expenses'),

    # Settlement Logic
    path('groups/<int:group_id>/settle/', SettleUpView.as_view(), name='settle-up'),
    path('groups/<int:group_id>/balances/', GroupBalanceView.as_view(), name='balances'),
]