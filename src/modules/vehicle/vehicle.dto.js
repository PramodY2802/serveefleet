const normalizePlateColor = (value) => {
  const color = String(value || '').trim().toLowerCase();
  return ['white', 'yellow', 'black', 'green', 'red'].includes(color) ? color : 'white';
};

export const createVehicleDto = ({ customerId, registrationNumber, plateColor, make, model, year, fuelType }) => ({
  customer: customerId,
  registrationNumber: registrationNumber.trim().toUpperCase(),
  plateColor: normalizePlateColor(plateColor),
  make: make?.trim() || undefined,
  model: model?.trim() || undefined,
  year: year !== undefined ? Number(year) : undefined,
  fuelType: fuelType?.trim() || undefined,
});

export const updateVehicleDto = ({ registrationNumber, plateColor, make, model, year, fuelType }) => {
  const payload = {};
  if (registrationNumber !== undefined) payload.registrationNumber = registrationNumber.trim().toUpperCase();
  if (plateColor !== undefined) payload.plateColor = normalizePlateColor(plateColor);
  if (make !== undefined) payload.make = make.trim();
  if (model !== undefined) payload.model = model.trim();
  if (year !== undefined) payload.year = Number(year);
  if (fuelType !== undefined) payload.fuelType = fuelType.trim();
  return payload;
};
