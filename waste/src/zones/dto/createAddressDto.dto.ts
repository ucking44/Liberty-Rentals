export class CreateAddressDto {
    street: string;
    city: string;
    state: string;
    landmark?: string;
    latitude: number;
    longitude: number;
}
