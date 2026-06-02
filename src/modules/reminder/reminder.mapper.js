const getId = (value) => value?._id || value?.id || value || null;

const toCustomer = (customer, fallback) => {
  const source = customer || fallback;
  if (!source) return undefined;
  return {
    id: getId(source),
    name: source.name,
    email: source.email,
    phone: source.phone,
  };
};

const toVehicle = (vehicle, fallback) => {
  const source = vehicle || fallback;
  if (!source) return undefined;
  return {
    id: getId(source),
    registrationNumber: source.registrationNumber,
    plateColor: source.plateColor,
    make: source.make,
    model: source.model,
    year: source.year,
    fuelType: source.fuelType,
  };
};

const toService = (service, fallback) => {
  const source = service || fallback;
  if (!source) return undefined;
  return {
    id: getId(source),
    serviceType: source.serviceType,
    serviceDate: source.serviceDate,
    nextServiceDue: source.nextServiceDue,
    nextServiceOdometer: source.nextServiceOdometer,
  };
};

export const toReminderResponse = (reminder) => {
  if (!reminder) return null;

  const customer = toCustomer(reminder.customerId, reminder.customerSnapshot);
  const vehicle = toVehicle(reminder.vehicleId, reminder.vehicleSnapshot);
  const service = toService(reminder.serviceId, reminder.sourceServiceSnapshot);
  const remindAt = reminder.remindAt ? new Date(reminder.remindAt) : null;
  const now = new Date();
  const isCancelled = reminder.status === 'CANCELLED';
  const isAcknowledged = reminder.status === 'ACKNOWLEDGED';
  const isOverdue = Boolean(
    remindAt &&
    remindAt.getTime() < now.getTime() &&
    !isCancelled &&
    !isAcknowledged
  );

  return {
    id: reminder._id,
    ownerUserId: reminder.ownerUserId,
    reminderType: reminder.reminderType,
    status: reminder.status,
    serviceId: getId(reminder.serviceId),
    vehicleId: getId(reminder.vehicleId),
    customerId: getId(reminder.customerId),
    serviceItemKey: reminder.serviceItemKey,
    sourceItemName: reminder.sourceItemName,
    sourceItemType: reminder.sourceItemType,
    sourceItemSnapshot: reminder.sourceItemSnapshot,
    sourceServiceSnapshot: reminder.sourceServiceSnapshot,
    remindAt: reminder.remindAt,
    timezone: reminder.timezone,
    dueOdometer: reminder.dueOdometer,
    channel: reminder.channel || { inApp: true, email: false, push: false },
    title: reminder.title,
    notes: reminder.notes,
    manualOverride: reminder.manualOverride,
    snoozedUntil: reminder.snoozedUntil,
    sentAt: reminder.sentAt,
    lastNotifiedAt: reminder.lastNotifiedAt,
    acknowledgedAt: reminder.acknowledgedAt,
    cancelledAt: reminder.cancelledAt,
    cancelReason: reminder.cancelReason,
    lastError: reminder.lastError,
    customer,
    vehicle,
    service,
    isOverdue,
    isDueNow: reminder.status === 'DUE',
    createdAt: reminder.createdAt,
    updatedAt: reminder.updatedAt,
  };
};
