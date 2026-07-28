export interface Participant {
  id: string;
  fullName: string;
  birthDate: string;
  cpf: string;
  email: string;
  phone: string;
  address: {
    street: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  regional: string;
  congregation: string;
  createdAt: string;
}
