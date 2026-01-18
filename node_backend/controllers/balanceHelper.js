// @desc    Get Group Balances (Comprehensive Debt View)
// @route   GET /api/expenses/groups/:id/balances/
const getGroupBalances = async (req, res) => {
    try {
        const groupId = req.params.id;
        const currentUserId = req.user._id.toString();

        const group = await Group.findById(groupId).populate('members', 'name username');
        if (!group) return res.status(404).json({ error: 'Group not found' });

        const expenses = await Expense.find({ group: groupId })
            .populate('paid_by', 'name username')
            .populate('shares.user', 'name username');

        // Initialize debt tracker for each member: { userId: { youOwe: 0, owesYou: 0 } }
        const debts = {};

        // Initialize all members (except current user)
        group.members.forEach(member => {
            const memberId = member._id.toString();
            if (memberId !== currentUserId) {
                debts[memberId] = {
                    userId: memberId,
                    name: member.name || member.username,
                    youOwe: 0,      // What current user owes this person
                    owesYou: 0,     // What this person owes current user
                    netBalance: 0   // Calculated later
                };
            }
        });

        // Calculate debts from all expenses
        expenses.forEach(expense => {
            const payerId = expense.paid_by._id.toString();

            expense.shares.forEach(share => {
                const shareUserId = share.user._id.toString();
                const shareAmount = share.amount;

                // Skip if both are current user
                if (payerId === currentUserId && shareUserId === currentUserId) return;

                // Case 1: Current user paid, someone else owes them
                if (payerId === currentUserId && shareUserId !== currentUserId) {
                    if (debts[shareUserId]) {
                        debts[shareUserId].owesYou += shareAmount;
                    }
                }
                // Case 2: Someone else paid, current user owes them
                else if (payerId !== currentUserId && shareUserId === currentUserId) {
                    if (debts[payerId]) {
                        debts[payerId].youOwe += shareAmount;
                    }
                }
            });
        });

        // Calculate net balances and summary totals
        let totalYouOwe = 0;
        let totalOwesYou = 0;

        const memberBalances = Object.values(debts).map(debt => {
            // Round to 2 decimal places
            debt.youOwe = Math.round(debt.youOwe * 100) / 100;
            debt.owesYou = Math.round(debt.owesYou * 100) / 100;
            debt.netBalance = Math.round((debt.owesYou - debt.youOwe) * 100) / 100;

            totalYouOwe += debt.youOwe;
            totalOwesYou += debt.owesYou;
            return debt;
        });

        // Filter out members with no transactions
        const activeBalances = memberBalances.filter(b =>
            Math.abs(b.youOwe) > 0.01 || Math.abs(b.owesYou) > 0.01
        );

        res.json({
            summary: {
                totalYouOwe: Math.round(totalYouOwe * 100) / 100,
                totalOwesYou: Math.round(totalOwesYou * 100) / 100,
                netBalance: Math.round((totalOwesYou - totalYouOwe) * 100) / 100
            },
            members: activeBalances
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = getGroupBalances;
