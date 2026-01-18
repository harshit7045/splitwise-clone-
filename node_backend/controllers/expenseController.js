const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');

// Helper to format expense
const formatExpense = (exp) => ({
    id: exp._id,
    description: exp.description,
    amount: exp.amount,
    category: exp.category,
    created_at: exp.createdAt,
    paid_by: exp.paid_by, // populated
    paid_by_name: exp.paid_by ? exp.paid_by.name : 'Unknown', // Flattened field
    shares: exp.shares
});

// @desc    List group expenses
// @route   GET /api/expenses/groups/:id/expenses/
const getGroupExpenses = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        if (!group.members.includes(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const expenses = await Expense.find({ group: req.params.id })
            .populate('paid_by', 'name username')
            .sort({ createdAt: -1 });

        res.json(expenses.map(formatExpense));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Create expense
// @route   POST /api/expenses/groups/:id/expenses/
const createExpense = async (req, res) => {
    const { description, amount, category, shares } = req.body;
    const groupId = req.params.id;

    try {
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        if (!group.members.includes(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Validate splits
        const sumShares = shares.reduce((acc, curr) => acc + Number(curr.amount), 0);
        // Using mild epsilon for float safety, though frontend should be sending precise 2-decimal strings/floats
        if (Math.abs(amount - sumShares) > 0.02) {
            return res.status(400).json({
                error: `Total amount (${amount}) does not match shares sum (${sumShares})`
            });
        }

        const expense = await Expense.create({
            group: groupId,
            paid_by: req.user._id,
            description,
            amount,
            category: category || 'OTHER',
            shares: shares.map(s => ({
                user: s.user_id, // Frontend sends user_id
                amount: s.amount
            }))
        });

        // Populate for return
        await expense.populate('paid_by', 'name username');

        res.status(201).json(formatExpense(expense));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Group Balances
// @route   GET /api/expenses/groups/:id/balances/
const getGroupBalances = async (req, res) => {
    try {
        const groupId = req.params.id;
        const group = await Group.findById(groupId).populate('members', 'name username');
        if (!group) return res.status(404).json({ error: 'Group not found' });

        const expenses = await Expense.find({ group: groupId });

        // Logic: Calculate Net Balance for each user
        // + means "I am owed", - means "I owe"
        let balances = {}; // { userId: { name, amount } }

        // Initialize 0 for all members
        group.members.forEach(member => {
            balances[member._id.toString()] = {
                name: member.name || member.username,
                amount: 0,
                id: member._id
            };
        });

        // Iterate expenses
        expenses.forEach(exp => {
            const payerId = exp.paid_by.toString();

            // Checking validation to ensure payer is in group map (robustness)
            if (balances[payerId]) {
                balances[payerId].amount += exp.amount;
            }

            // Subtract shares
            exp.shares.forEach(share => {
                const debtorId = share.user.toString();
                if (balances[debtorId]) {
                    balances[debtorId].amount -= share.amount;
                }
            });
        });

        // Format for frontend
        // Only valid if I am Viewer? The Django view calculated relative to "Me".
        // Actually, the Django view returned a list of { user, amount, status } relative to Me.
        // Wait, the Django logic was:
        // "owed_to_me": filter(paid_by=Me).exclude(user=Me)
        // "owe_them": filter(user=Me).exclude(paid_by=Me)

        // This Node implementation above calculates global Net Balance for everyone in group.
        // To match Django EXACTLY, we should filter relative to req.user.

        const myId = req.user._id.toString();
        const myNet = balances[myId] ? balances[myId].amount : 0; // This is my global net in the group.

        // But wait, the UI shows "Harshit gets 100", "Alice owes 50".
        // If the UI expects a list of balances for EVERYONE, my logic is correct.
        // Let's check what Django returned.
        // Django returned: [ { user: "Name", status: "You owe", amount: X } ]
        // It calculated pairwise debt? No, it aggregated totals.
        // "balances_map[uid]"...

        // Let's refine the calculation to be simpler and match the general expectation.
        // The list returned by Django seemed to be "Balances of other people relative to Me"?
        // No, `GroupBalanceView` in Django returned a list of users and their net balances visible to the user.
        // Actually, looking at previous code, it calculated `owed_to_me` and `b_owe_them`.
        // That implies specific pairwise relationships or just net distinct sums.
        // The Node logic above (Net Balance per person) is the standard Splitwise way.
        // "Alice +10", "Bob -10".
        // If the UI expects "You owe Bob 10", that's pairwise.
        // If UI expects "Bob owes 10", that's Net.

        // I will stick to the Net Balance calculation essentially.
        // But I need to format it to: { user: Name, amount: Abs(Net), status: "You owe" / "You are owed" }?
        // Wait, "You owe" implies a relationship to ME.
        // If I use the Global Net approach: 
        // If I am +100, and Bob is -100. It says "You are owed 100".
        // If Bob is +50, I am -50. It says "You owe 50".
        // The Django view calculated specifically `owed_to_me` (splits I paid for others) vs `owe_them` (splits others paid for me).
        // That is technically "Net Balance with the Group", but derived from specific transactions involving ME.
        // So effectively, it ignores transactions between Alice and Bob where I am not involved.

        // CORRECT LOGIC TO MATCH DJANGO:
        let myBalancesWithOthers = {}; // { otherUserId: netAmount }

        expenses.forEach(exp => {
            const payerId = exp.paid_by.toString();

            if (payerId === myId) {
                // I paid. Others owe me.
                exp.shares.forEach(share => {
                    const debtorId = share.user.toString();
                    if (debtorId !== myId) {
                        myBalancesWithOthers[debtorId] = (myBalancesWithOthers[debtorId] || 0) + share.amount;
                    }
                });
            } else {
                // Someone else paid. Did I participate?
                const myShare = exp.shares.find(s => s.user.toString() === myId);
                if (myShare) {
                    // I owe the payer.
                    myBalancesWithOthers[payerId] = (myBalancesWithOthers[payerId] || 0) - myShare.amount;
                }
            }
        });

        let responseList = [];
        for (const [uid, amount] of Object.entries(myBalancesWithOthers)) {
            if (Math.abs(amount) > 0.01) {
                const otherMember = group.members.find(m => m._id.toString() === uid);
                const name = otherMember ? (otherMember.name || otherMember.username) : 'Unknown';

                responseList.push({
                    user: name,
                    user_id: uid,
                    amount: Math.abs(amount),
                    status: amount > 0 ? "You are owed" : "You owe"
                });
            }
        }

        res.json(responseList);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Global Balance
// @route   GET /api/expenses/global-balance/
const getUserGlobalBalance = async (req, res) => {
    try {
        const myId = req.user._id.toString();
        // Determine all expenses where I am involved
        // Optimization: In a real app, use MongoDB aggregation framework
        const expenses = await Expense.find({
            $or: [
                { paid_by: req.user._id },
                { 'shares.user': req.user._id }
            ]
        });

        let youOwe = 0;
        let owedToYou = 0;

        expenses.forEach(exp => {
            const payerId = exp.paid_by.toString();

            if (payerId === myId) {
                // I paid. Calculate what others owe me
                exp.shares.forEach(share => {
                    if (share.user.toString() !== myId) {
                        owedToYou += share.amount;
                    }
                });
            } else {
                // Someone else paid. Calculate what I owe
                const myShare = exp.shares.find(s => s.user.toString() === myId);
                if (myShare) {
                    youOwe += myShare.amount;
                }
            }
        });

        res.json({
            total_balance: owedToYou - youOwe,
            you_owe: youOwe,
            owed_to_you: owedToYou
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get User Activity
// @route   GET /api/expenses/activity/
const getUserActivity = async (req, res) => {
    try {
        // Find expenses in groups I am a member of
        const groups = await Group.find({ members: req.user._id });
        const groupIds = groups.map(g => g._id);

        const expenses = await Expense.find({ group: { $in: groupIds } })
            .populate('paid_by', 'name username')
            .sort({ createdAt: -1 })
            .limit(20); // Pagination in Django was 100, we can limit here

        res.json(expenses.map(formatExpense));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getGroupExpenses,
    createExpense,
    getGroupBalances,
    getUserGlobalBalance,
    getUserActivity
};
