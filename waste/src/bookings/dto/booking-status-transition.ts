import { BookingStatus } from 'src/enums/bookingStatus.enum';

export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.PENDING]: [BookingStatus.ASSIGNED, BookingStatus.CANCELLED],

    [BookingStatus.ASSIGNED]: [BookingStatus.ACCEPTED, BookingStatus.DECLINED, BookingStatus.CANCELLED],

    [BookingStatus.ACCEPTED]: [BookingStatus.EN_ROUTE, BookingStatus.CANCELLED],

    [BookingStatus.EN_ROUTE]: [BookingStatus.PICKED_UP, BookingStatus.FAILED],

    [BookingStatus.PICKED_UP]: [BookingStatus.COMPLETED],
    [BookingStatus.CONFIRMED]: [BookingStatus.ASSIGNED],
    [BookingStatus.DECLINED]: [BookingStatus.REASSIGNING],
    [BookingStatus.REASSIGNING]: [BookingStatus.ASSIGNED, BookingStatus.CANCELLED],

    [BookingStatus.COMPLETED]: [],

    [BookingStatus.CANCELLED]: [],

    [BookingStatus.FAILED]: [],

};
