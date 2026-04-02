import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export const preferenceClient = new Preference(client);
export const paymentClient = new Payment(client);

/** Service fee: $1.500 CLP fixed */
export const SERVICE_FEE = 1500;

/** Shipping costs by speed */
export const SHIPPING_COSTS: Record<string, number> = {
  standard: 2900,
  express: 4500,
};

/** Courier by speed */
export const COURIER_BY_SPEED: Record<string, string> = {
  standard: "Chilexpress",
  express: "Rappi",
};
