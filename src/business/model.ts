export const services = [
  {
    id: "room-planning",
    name: "Room planning",
    price: 180,
    tagline: "A clearer plan for the space you have.",
    description:
      "Explore furniture layout, circulation, and the small decisions that make a room easier to use.",
    includes: [
      "A room layout concept",
      "Furniture placement notes",
      "A simple plan for your next steps",
    ],
    boundary:
      "A fictional remote planning package, not architectural drawings or construction advice.",
    variant: "living",
  },
  {
    id: "styling",
    name: "Space styling",
    price: 120,
    tagline: "A little intention. A different feeling.",
    description:
      "Bring color, texture, lighting, and everyday objects into a more considered whole.",
    includes: [
      "A styling direction and mood palette",
      "Lighting and texture suggestions",
      "An arrangement guide for existing pieces",
    ],
    boundary:
      "A fictional styling package. Furniture, materials, shopping, and installation are not included.",
    variant: "nook",
  },
  {
    id: "workspace",
    name: "Workspace refresh",
    price: 220,
    tagline: "Make space for a better working day.",
    description:
      "Plan a small home workspace around focus, storage, and the way you actually work.",
    includes: [
      "A desk and storage layout concept",
      "Lighting and visual-clutter notes",
      "A workspace setup checklist",
    ],
    boundary:
      "A fictional workspace concept, not a professional ergonomic assessment or technical installation.",
    variant: "work",
  },
] as const;
export type ServiceId = (typeof services)[number]["id"];
export const extras = [
  {
    id: "palette",
    name: "Color palette",
    price: 45,
    description: "A focused set of colors for the project.",
  },
  {
    id: "shopping",
    name: "Shopping shortlist",
    price: 75,
    description:
      "A fictional shortlist of item types; no products or purchases are connected.",
  },
  {
    id: "call",
    name: "Feedback session",
    price: 30,
    description:
      "An illustrative 30-minute review add-on; no meeting is booked.",
  },
] as const;
export type ExtraId = (typeof extras)[number]["id"];
export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
export function calculateQuote(
  serviceId: ServiceId,
  rooms: number,
  selected: ExtraId[],
) {
  const service = services.find((item) => item.id === serviceId);
  if (!service) throw new RangeError("Choose a listed service.");
  if (!Number.isInteger(rooms) || rooms < 1 || rooms > 5)
    throw new RangeError("Choose 1–5 rooms.");
  if (
    new Set(selected).size !== selected.length ||
    selected.some((id) => !extras.some((extra) => extra.id === id))
  )
    throw new RangeError("Choose each listed add-on at most once.");
  const lines = [
    {
      label: `${service.name} · ${rooms} ${rooms === 1 ? "room" : "rooms"} × ${money(service.price)}`,
      amount: service.price * rooms,
    },
    ...extras
      .filter((extra) => selected.includes(extra.id))
      .map((extra) => ({ label: extra.name, amount: extra.price })),
  ];
  return {
    serviceId,
    serviceName: service.name,
    rooms,
    extras: [...selected],
    lines,
    total: lines.reduce((total, line) => total + line.amount, 0),
  };
}
export type Quote = ReturnType<typeof calculateQuote>;
export type Enquiry = {
  name: string;
  email: string;
  brief: string;
  consent: boolean;
};
export type EnquiryErrors = Partial<Record<keyof Enquiry, string>>;
export function validateEnquiry(form: Enquiry): EnquiryErrors {
  const errors: EnquiryErrors = {};
  if (form.name.trim().length < 2 || form.name.trim().length > 80)
    errors.name =
      "Enter a name between 2 and 80 characters. Sample details are welcome.";
  if (
    form.email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  )
    errors.email = "Enter an email in the format name@example.com.";
  if (form.brief.trim().length < 20 || form.brief.trim().length > 1200)
    errors.brief = "Describe the space in 20–1,200 characters.";
  if (!form.consent)
    errors.consent = "Confirm that this is a demo and nothing will be sent.";
  return errors;
}
export function enquiryText(enquiry: Enquiry, quote: Quote) {
  return [
    "FORM & FIELD — DEMO ENQUIRY / NOT SENT",
    "",
    `Name: ${enquiry.name.trim()}`,
    `Email: ${enquiry.email.trim()}`,
    "",
    "Project brief:",
    enquiry.brief.trim(),
    "",
    "Illustrative estimate (USD):",
    ...quote.lines.map((line) => `${line.label}: ${money(line.amount)}`),
    `Total: ${money(quote.total)} USD`,
    "",
    "This is a local preview. No message, booking, payment, or real quote has been sent or created.",
  ].join("\n");
}
