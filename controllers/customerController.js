import Customer from '../models/Customer.js';

/**
 * @route   POST /api/customers
 * @desc    Add a new customer for logged-in user
 * @access  Private
 */
export const addCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const existing = await Customer.findOne({ email });

    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const newCustomer = await Customer.create({
      userId: req.user.userId, // from decoded JWT
      name,
      email,
      phone,
      address
    });

    return res.status(201).json(newCustomer);
    
  } catch (err) {
    console.error('Add customer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/customers/:userId
 * @desc    Get all customers for a specific user (must match logged in)
 * @access  Private
 */
export const getCustomersByUser = async (req, res) => {
  try {
    const userIdFromToken = req.user.userId;
    const { userId } = req.params;

  
    if (Number(userId) !== Number(userIdFromToken)) {
  return res.status(403).json({ message: 'Access denied' });
}


    const customers = await Customer.find({ userId });
    res.json(customers);
  } catch (err) {
    console.error('Get customers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCurrentUserCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user.userId });
    res.json(customers);
  } catch (err) {
    console.error('Get current user customers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * @route   GET /api/customers/:id
 * @desc    Get a single customer by _id (no auth check)
 * @access  Public or Private (based on your app)
 */
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findOne({ _id: id });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (err) {
    console.error('Get customer by ID error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete a customer by ID
 * @access  Private
 */
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (Number(customer.userId) !== Number(req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Customer.findByIdAndDelete(id); // ✅ Fixed

    res.json({ message: 'Customer deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer by ID (only if belongs to logged-in user)
 * @access  Private
 */
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const customer = await Customer.findById(id);
    console.log(customer)

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (Number( customer.userId )!==Number(req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update fields
    customer.name = name || customer.name;
    customer.email = email || customer.email;
    customer.phone = phone || customer.phone;
    customer.address = address || customer.address;
    customer.updated_at = Date.now();

    await customer.save();

    return res.json(customer);
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
