const Group = require('../models/Group');
const User = require('../models/User');

// Helper to format group for frontend (id vs _id)
const formatGroup = (group) => ({
    id: group._id,
    name: group.name,
    created_by: group.created_by,
    created_at: group.createdAt, // Frontend might expect snake_case
    members: group.members
});

// @desc    List user's groups
// @route   GET /api/expenses/groups/
const getUserGroups = async (req, res) => {
    // Find groups where members array contains req.user._id
    const groups = await Group.find({ members: req.user._id }).sort({ createdAt: -1 });
    res.json(groups.map(formatGroup));
};

// @desc    Create a new group
// @route   POST /api/expenses/groups/
const createGroup = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Group name is required' });
    }

    const group = await Group.create({
        name,
        created_by: req.user._id,
        members: [req.user._id] // Creator is first member
    });

    res.status(201).json(formatGroup(group));
};

// @desc    Join a group
// @route   POST /api/expenses/groups/:id/join/
const joinGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ error: 'Group not found with this ID' });
        }

        // Check if already member
        if (group.members.includes(req.user._id)) {
            return res.status(400).json({ error: 'You are already a member of this group' });
        }

        group.members.push(req.user._id);
        await group.save();

        res.json({ message: 'Joined group successfully', group: formatGroup(group) });
    } catch (error) {
        // Handle CastError (Invalid ObjectId format like "abc123")
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid Group ID format' });
        }
        console.error(error);
        res.status(500).json({ error: 'Server error while joining group' });
    }
};

// @desc    Get Group Members
// @route   GET /api/expenses/groups/:id/members/
const getGroupMembers = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id).populate('members', 'name username email');

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Security Check: Must be member to see members
        const isMember = group.members.some(member => member._id.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ error: 'Not authorized to view this group' });
        }

        // Format members list
        const members = group.members.map(m => ({
            id: m._id,
            name: m.name,
            username: m.username,
            email: m.email
        }));

        res.json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Get Group Detail
// @route   GET /api/expenses/groups/:id/
const getGroupDetail = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id).populate('members', 'name username email');

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Security Check: Must be member to view group
        const isMember = group.members.some(member => member._id.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ error: 'Not authorized to view this group' });
        }

        res.json(formatGroup(group));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = { getUserGroups, createGroup, joinGroup, getGroupMembers, getGroupDetail };
