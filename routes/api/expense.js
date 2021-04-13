const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Expense = require('../../models/Expense');
const Project = require('../../models/Project');

router.post('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    const newExpense = new Expense({
      project: project.id,
      creator: req.user.id,
      text: req.body.text,
      amount: req.body.amount,
    });
    project.expenses.unshift(newExpense);
    project.save();
    const expense = await newExpense.save();
    res.json(expense);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.find({
      project: req.params.id,
    });
    res.json(expense);
  } catch (error) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

router.delete('/:id/:expense_id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    const expenseId = project.expenses.map((val) => val._id);

    const expense = await Project.find({
      expenses: {
        $in: expenseId,
      },
    });

    if (!expense) {
      return res.status(400).json({ msg: 'Expense does not exist' });
    }

    const removeExpense = await Expense.findById(req.params.expense_id);

    const removeIndex = project.expenses
      .map((x) => x._id.toString())
      .indexOf(req.params.expense_id);

    project.expenses.splice(removeIndex, 1);

    await project.save();
    await removeExpense.remove();

    res.json({
      msg: 'Transaction Deleted',
    });
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server Error');
  }
});

module.exports = router;
