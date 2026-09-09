export const DEFAULT_FINANCE_CATEGORIES = {
  expense: [
    {
      name: 'Food & Dining',
      subCategories: ['Groceries', 'Restaurants', 'Coffee & Snacks', 'Delivery'],
    },
    {
      name: 'Shopping',
      subCategories: ['Clothing', 'Electronics', 'Home & Garden', 'Personal Care'],
    },
    {
      name: 'Housing & Rent',
      subCategories: ['Rent', 'Maintenance', 'Furniture'],
    },
    {
      name: 'Bills & Utilities',
      subCategories: ['Electricity', 'Water', 'Internet', 'Mobile', 'Gas', 'Subscriptions'],
    },
    {
      name: 'Transportation',
      subCategories: ['Fuel', 'Public Transit', 'Taxi/Rideshare', 'Vehicle Maintenance'],
    },
    {
      name: 'Entertainment',
      subCategories: ['Movies & Shows', 'Gaming', 'Events', 'Hobbies'],
    },
    {
      name: 'Health & Fitness',
      subCategories: ['Medical', 'Pharmacy', 'Gym Membership', 'Supplements'],
    },
    {
      name: 'Education',
      subCategories: ['Books', 'Courses', 'Software', 'Tuition'],
    },
    {
      name: 'Gifts & Donations',
      subCategories: ['Charity/Zakat', 'Gifts', 'Family Support'],
    },
    {
      name: 'Other Expense',
      subCategories: ['Miscellaneous', 'Uncategorized'],
    },
  ],
  income: [
    {
      name: 'Salary',
      subCategories: ['Full-time', 'Part-time', 'Bonus'],
    },
    {
      name: 'Freelance & Business',
      subCategories: ['Client Projects', 'Sales', 'Consulting'],
    },
    {
      name: 'Investment',
      subCategories: ['Dividends', 'Crypto', 'Stocks', 'Real Estate'],
    },
    {
      name: 'Gift & Support',
      subCategories: ['Family Gift', 'Refund', 'Allowance'],
    },
    {
      name: 'Other Income',
      subCategories: ['Miscellaneous'],
    },
  ],
  transfer: [
    {
      name: 'Account Transfer',
      subCategories: ['Savings', 'Investment Account', 'Cash Withdrawal'],
    },
  ],
};

export const DEFAULT_PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Mobile Banking (bKash/Nagad)',
  'Bank Transfer',
  'Other',
];

export const SUPPORTED_CURRENCIES = ['USD', 'BDT', 'SAR', 'EUR', 'GBP'];
