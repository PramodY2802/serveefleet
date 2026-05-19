export const createVehicleDto = ({ customerId, registrationNumber, make, model, year, fuelType }) => ({
  customer: customerId,
  registrationNumber: registrationNumber.trim().toUpperCase(),
  make: make?.trim() || undefined,
  model: model?.trim() || undefined,
  year: year !== undefined ? Number(year) : undefined,
  fuelType: fuelType?.trim() || undefined,
});

export const updateVehicleDto = ({ registrationNumber, make, model, year, fuelType }) => {
  const payload = {};
  if (registrationNumber !== undefined) payload.registrationNumber = registrationNumber.trim().toUpperCase();
  if (make !== undefined) payload.make = make.trim();
  if (model !== undefined) payload.model = model.trim();
  if (year !== undefined) payload.year = Number(year);
  if (fuelType !== undefined) payload.fuelType = fuelType.trim();
  return payload;
};
