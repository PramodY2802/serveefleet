export const createCustomerDto = ({ name, email, phone, address }) => ({
  name: name.trim(),
  email: email.toLowerCase().trim(),
  phone: phone?.trim() || undefined,
  address: address?.trim() || undefined,
});

export const updateCustomerDto = ({ name, email, phone, address }) => {
  const payload = {};
  if (name !== undefined) payload.name = name.trim();
  if (email !== undefined) payload.email = email.toLowerCase().trim();
  if (phone !== undefined) payload.phone = phone.trim();
  if (address !== undefined) payload.address = address.trim();
  return payload;
};
