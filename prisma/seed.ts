import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import bcrypt from "bcryptjs"
import { haversineKm } from "../lib/distance"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ── Drivers ────────────────────────────────────────────────────────

const DRIVERS_DATA = [
  { name: "Carlos López",      dni: "12345678", email: "carlos@freightflow.com",     phone: "+51 999 123 456", license: "LIC-001" },
  { name: "María García",      dni: "23456789", email: "maria@freightflow.com",      phone: "+51 999 234 567", license: "LIC-002" },
  { name: "Juan Mamani",       dni: "34567890", email: "juan@freightflow.com",       phone: "+51 999 345 678", license: "LIC-003" },
  { name: "Rosa Quispe",       dni: "45678901", email: "rosa@freightflow.com",       phone: "+51 999 456 789", license: "LIC-004" },
  { name: "Luis Torres",       dni: "56789012", email: "luis@freightflow.com",       phone: "+51 999 567 890", license: "LIC-005" },
  { name: "Ana Huamán",        dni: "67890123", email: "ana@freightflow.com",        phone: "+51 999 678 901", license: "LIC-006" },
  { name: "Miguel Ramos",      dni: "78901234", email: "miguel@freightflow.com",     phone: "+51 999 789 012", license: "LIC-007" },
  { name: "Carmen Mendoza",    dni: "89012345", email: "carmen@freightflow.com",     phone: "+51 999 890 123", license: "LIC-008" },
  { name: "Pedro Sánchez",     dni: "90123456", email: "pedro.d@freightflow.com",    phone: "+51 999 901 234", license: "LIC-009" },
  { name: "Lucía Vargas",      dni: "10123456", email: "lucia.v@freightflow.com",    phone: "+51 999 012 345", license: "LIC-010" },
  { name: "Diego Flores",      dni: "11123456", email: "diego@freightflow.com",      phone: "+51 999 111 456", license: "LIC-011" },
  { name: "Sofía Ríos",        dni: "12123456", email: "sofia@freightflow.com",      phone: "+51 999 222 567", license: "LIC-012" },
  { name: "Javier Paredes",    dni: "13123456", email: "javier@freightflow.com",     phone: "+51 999 333 678", license: "LIC-013" },
  { name: "Valeria Castro",    dni: "14123456", email: "valeria@freightflow.com",    phone: "+51 999 444 789", license: "LIC-014" },
  { name: "Fernando Ruiz",     dni: "15123456", email: "fernando@freightflow.com",   phone: "+51 999 555 890", license: "LIC-015" },
  { name: "Patricia Delgado",  dni: "16123456", email: "patricia@freightflow.com",   phone: "+51 999 666 901", license: "LIC-016" },
  { name: "Ricardo Vega",      dni: "17123456", email: "ricardo@freightflow.com",    phone: "+51 999 777 012", license: "LIC-017" },
  { name: "Gabriela Silva",    dni: "18123456", email: "gabriela@freightflow.com",   phone: "+51 999 888 123", license: "LIC-018" },
  { name: "Andrés Medina",     dni: "19123456", email: "andres@freightflow.com",     phone: "+51 999 999 234", license: "LIC-019" },
  { name: "Elena Campos",      dni: "20123456", email: "elena@freightflow.com",      phone: "+51 999 000 345", license: "LIC-020" },
]

// ── Clients ───────────────────────────────────────────────────────

const CLIENTS_DATA = [
  { name: "ElectroWorld Perú",           ruc: "20123456789", email: "contacto@electroworld.pe",        phone: "+51 999 111 223", address: "Av. La Molina 350, Lima, Lima" },
  { name: "Muebles Finos del Sur",       ruc: "20234567890", email: "ventas@mueblesfinos.pe",          phone: "+51 999 222 334", address: "Calle Mercaderes 120, Arequipa, Arequipa" },
  { name: "Textiles del Norte",          ruc: "20345678901", email: "info@textilesnorte.pe",           phone: "+51 999 333 445", address: "Av. España 450, Trujillo, La Libertad" },
  { name: "San Martín Distribuciones",   ruc: "20456789012", email: "pedidos@sanmartin.pe",            phone: "+51 999 444 556", address: "Jr. Huallaga 280, Huánuco, Huánuco" },
  { name: "Agroindustrias Ica",          ruc: "20567890123", email: "ventas@agroica.pe",               phone: "+51 999 555 667", address: "Av. Grau 500, Ica, Ica" },
  { name: "Inversiones Cusco",           ruc: "20678901234", email: "info@inversionescusco.pe",        phone: "+51 999 666 778", address: "Av. Sol 800, Cusco, Cusco" },
  { name: "Constructora Los Andes",      ruc: "20789012345", email: "ventas@constructoralosandes.pe",  phone: "+51 999 777 889", address: "Av. Arequipa 1200, Lima, Lima" },
  { name: "Farmacias del Perú",          ruc: "20890123456", email: "pedidos@farmaciasperu.pe",        phone: "+51 999 888 990", address: "Jr. Camaná 250, Lima, Lima" },
  { name: "Minera Andina SAC",           ruc: "20901234567", email: "logistica@mineraandina.pe",       phone: "+51 999 000 111", address: "Av. Ejército 900, Arequipa, Arequipa" },
  { name: "Autorepuestos del Norte",     ruc: "21012345678", email: "ventas@autorepuestosnorte.pe",    phone: "+51 999 111 222", address: "Av. Larco 800, Trujillo, La Libertad" },
  { name: "Industrias Plásticas Unidas", ruc: "21123456789", email: "info@plasticasunidas.pe",         phone: "+51 999 222 333", address: "Av. Industrial 450, Lima, Lima" },
  { name: "Distribuidora Santa Rosa",    ruc: "21234567890", email: "pedidos@santarosa.pe",            phone: "+51 999 333 444", address: "Jr. Unión 300, Ica, Ica" },
  { name: "Tecnología Global SAC",       ruc: "21345678901", email: "ventas@tecnoglobal.pe",           phone: "+51 999 444 555", address: "Av. Angamos 600, Lima, Lima" },
  { name: "Agrícola San Juan",           ruc: "21456789012", email: "info@agricolasjuan.pe",           phone: "+51 999 555 666", address: "Carretera Panamericana Sur Km 200, Ica, Ica" },
  { name: "Corporación Textil del Sur",  ruc: "21567890123", email: "ventas@corptextilsur.pe",         phone: "+51 999 666 777", address: "Av. España 600, Arequipa, Arequipa" },
  { name: "Molinera del Sur SAC",        ruc: "21678901234", email: "pedidos@molinerasur.pe",          phone: "+51 999 777 888", address: "Av. Grau 400, Arequipa, Arequipa" },
  { name: "Transportes Rápidos EIRL",    ruc: "21789012345", email: "logistica@transportesrapidos.pe", phone: "+51 999 888 999", address: "Av. Argentina 200, Lima, Lima" },
  { name: "Ferretería El Constructor",   ruc: "21890123456", email: "ventas@ferreteriaconstructor.pe", phone: "+51 999 999 000", address: "Jr. Puno 150, Huancayo, Junín" },
  { name: "Derco Maquinarias",           ruc: "21901234567", email: "repuestos@derco.pe",              phone: "+51 999 000 222", address: "Av. Elmer Faucett s/n, Callao, Callao" },
  { name: "Embotelladora del Norte",     ruc: "22012345678", email: "pedidos@embotelladoranorte.pe",   phone: "+51 999 111 333", address: "Av. Industrial 800, Chiclayo, Lambayeque" },
]

// ── Shipments ─────────────────────────────────────────────────────

type ShipmentInput = {
  tracking: string; category: "ELECTRONICA" | "MOBILIARIO" | "ROPA" | "ALIMENTOS" | "MAQUINARIA" | "OTROS"
  origin: string; destination: string; weight: number; fee: number; status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED"
  originLat: number; originLng: number; destLat: number; destLng: number
  arrivalYear: number; arrivalMonth: number; arrivalDay: number
  clientEmail: string; driverEmail: string | null
}

const SHIPMENTS_DATA: ShipmentInput[] = [
  // ── Existing 10 ──
  { tracking: "#001234ABCD", category: "ELECTRONICA", origin: "Av. La Marina 1234, Lima, Lima",        destination: "Jr. Grau 456, Huacho, Lima",              weight: 25,  fee: 450,  status: "DELIVERED",  originLat: -12.0464, originLng: -77.0428, destLat: -11.1066, destLng: -77.6116, arrivalYear: 2026, arrivalMonth: 5,  arrivalDay: 20, clientEmail: "contacto@electroworld.pe",        driverEmail: "carlos@freightflow.com" },
  { tracking: "#0023456LKH", category: "MOBILIARIO",  origin: "Carretera Panamericana Norte Km 50, Lima, Lima", destination: "Av. Jesús de Nazareth 789, Trujillo, La Libertad", weight: 50,  fee: 1800, status: "PENDING",    originLat: -12.0464, originLng: -77.0428, destLat: -8.1090,  destLng: -79.0215, arrivalYear: 2026, arrivalMonth: 6,  arrivalDay: 15, clientEmail: "ventas@mueblesfinos.pe",          driverEmail: "maria@freightflow.com" },
  { tracking: "#0034567MNB", category: "ROPA",        origin: "Av. Larco 567, Trujillo, La Libertad",   destination: "Calle Real 890, Chiclayo, Lambayeque",    weight: 30,  fee: 900,  status: "DELIVERED",  originLat: -8.1090,  originLng: -79.0215, destLat: -6.7716,  destLng: -79.8409, arrivalYear: 2026, arrivalMonth: 6,  arrivalDay: 8,  clientEmail: "info@textilesnorte.pe",           driverEmail: "carlos@freightflow.com" },
  { tracking: "#0045678QWE", category: "ALIMENTOS",   origin: "Av. Javier Prado 2100, Lima, Lima",     destination: "Calle Bolívar 333, Ica, Ica",              weight: 100, fee: 1200, status: "DELIVERED",  originLat: -12.0464, originLng: -77.0428, destLat: -14.0678, destLng: -75.7286, arrivalYear: 2026, arrivalMonth: 6,  arrivalDay: 10, clientEmail: "pedidos@sanmartin.pe",            driverEmail: "maria@freightflow.com" },
  { tracking: "#0056789RTY", category: "MAQUINARIA",  origin: "Av. Ejército 567, Arequipa, Arequipa",  destination: "Av. El Sol 1200, Cusco, Cusco",           weight: 500, fee: 3500, status: "PENDING",    originLat: -16.4090, originLng: -71.5375, destLat: -13.5170, destLng: -71.9781, arrivalYear: 2026, arrivalMonth: 6,  arrivalDay: 22, clientEmail: "contacto@electroworld.pe",        driverEmail: "juan@freightflow.com" },
  { tracking: "#0067890FGH", category: "ELECTRONICA", origin: "Av. Grau 500, Ica, Ica",                destination: "Jr. Puno 234, Ayacucho, Ayacucho",         weight: 40,  fee: 750,  status: "DELIVERED",  originLat: -14.0678, originLng: -75.7286, destLat: -13.1631, destLng: -74.2232, arrivalYear: 2026, arrivalMonth: 6,  arrivalDay: 18, clientEmail: "ventas@agroica.pe",               driverEmail: "rosa@freightflow.com" },
  { tracking: "#0078901JKL", category: "ALIMENTOS",   origin: "Av. Sol 800, Cusco, Cusco",            destination: "Jr. Junín 456, Puno, Puno",                weight: 80,  fee: 1500, status: "IN_TRANSIT", originLat: -13.5170, originLng: -71.9781, destLat: -15.8402, destLng: -70.0219, arrivalYear: 2026, arrivalMonth: 6,  arrivalDay: 12, clientEmail: "info@inversionescusco.pe",        driverEmail: "luis@freightflow.com" },
  { tracking: "#0089012MNO", category: "ROPA",        origin: "Av. Tacna 789, Lima, Lima",             destination: "Jr. Amazonas 123, Piura, Piura",           weight: 60,  fee: 2100, status: "DELIVERED",  originLat: -12.0464, originLng: -77.0428, destLat: -5.1945,  destLng: -80.6328, arrivalYear: 2026, arrivalMonth: 5,  arrivalDay: 28, clientEmail: "ventas@mueblesfinos.pe",          driverEmail: "maria@freightflow.com" },
  { tracking: "#0090123PQR", category: "MOBILIARIO",  origin: "Jr. Puno 234, Ayacucho, Ayacucho",     destination: "Av. Grau 500, Ica, Ica",                   weight: 150, fee: 1100, status: "CANCELLED",  originLat: -13.1631, originLng: -74.2232, destLat: -14.0678, destLng: -75.7286, arrivalYear: 2026, arrivalMonth: 5,  arrivalDay: 30, clientEmail: "pedidos@sanmartin.pe",            driverEmail: "ana@freightflow.com" },
  { tracking: "#0012345STU", category: "ELECTRONICA", origin: "Av. Sol 800, Cusco, Cusco",             destination: "Av. Ejército 567, Arequipa, Arequipa",     weight: 35,  fee: 650,  status: "DELIVERED",  originLat: -13.5170, originLng: -71.9781, destLat: -16.4090, destLng: -71.5375, arrivalYear: 2026, arrivalMonth: 6,  arrivalDay: 25, clientEmail: "info@inversionescusco.pe",        driverEmail: null },

  // ── New 15: spread across all months ──
  // Jan
  { tracking: "#00AABBCC11", category: "ELECTRONICA", origin: "Av. Brasil 800, Lima, Lima",            destination: "Calle Real 450, Chiclayo, Lambayeque",     weight: 20,  fee: 550,  status: "DELIVERED",  originLat: -12.0464, originLng: -77.0428, destLat: -6.7716,  destLng: -79.8409, arrivalYear: 2026, arrivalMonth: 0,  arrivalDay: 15, clientEmail: "contacto@electroworld.pe",        driverEmail: "carlos@freightflow.com" },
  { tracking: "#00BBCCDD22", category: "ROPA",        origin: "Calle San Juan de Dios 200, Arequipa, Arequipa", destination: "Av. Bolognesi 500, Tacna, Tacna",           weight: 45,  fee: 800,  status: "DELIVERED",  originLat: -16.4090, originLng: -71.5375, destLat: -18.0083, destLng: -70.2509, arrivalYear: 2026, arrivalMonth: 0,  arrivalDay: 28, clientEmail: "info@textilesnorte.pe",           driverEmail: "maria@freightflow.com" },

  // Feb
  { tracking: "#00CCDDEE33", category: "ALIMENTOS",   origin: "Jr. Grau 200, Trujillo, La Libertad",   destination: "Av. Independencia 800, Cajamarca, Cajamarca", weight: 200, fee: 1600, status: "DELIVERED",  originLat: -8.1090,  originLng: -79.0215, destLat: -7.1617,  destLng: -78.5123, arrivalYear: 2026, arrivalMonth: 1,  arrivalDay: 10, clientEmail: "ventas@constructoralosandes.pe",   driverEmail: "juan@freightflow.com" },
  { tracking: "#00DDEEFF44", category: "MAQUINARIA",  origin: "Av. Colonial 1500, Lima, Lima",         destination: "Jr. Real 600, Huancayo, Junín",            weight: 600, fee: 4200, status: "DELIVERED",  originLat: -12.0464, originLng: -77.0428, destLat: -12.0653, destLng: -75.2096, arrivalYear: 2026, arrivalMonth: 1,  arrivalDay: 22, clientEmail: "logistica@mineraandina.pe",        driverEmail: "luis@freightflow.com" },

  // Mar
  { tracking: "#00EEFFGG55", category: "OTROS",       origin: "Av. Grau 100, Piura, Piura",            destination: "Jr. Libertad 300, Tumbes, Tumbes",         weight: 100, fee: 700,  status: "DELIVERED",  originLat: -5.1945,  originLng: -80.6328, destLat: -3.5669,  destLng: -80.4512, arrivalYear: 2026, arrivalMonth: 2,  arrivalDay: 5,  clientEmail: "ventas@autorepuestosnorte.pe",     driverEmail: "ana@freightflow.com" },
  { tracking: "#00FFGGHH66", category: "MOBILIARIO",  origin: "Av. El Sol 400, Cusco, Cusco",          destination: "Av. Madre de Dios 100, Puerto Maldonado, Madre de Dios", weight: 300, fee: 2800, status: "DELIVERED",  originLat: -13.5170, originLng: -71.9781, destLat: -12.5933, destLng: -69.1894, arrivalYear: 2026, arrivalMonth: 2,  arrivalDay: 18, clientEmail: "ventas@corptextilsur.pe",          driverEmail: "rosa@freightflow.com" },

  // Apr
  { tracking: "#00GGHHII77", category: "ELECTRONICA", origin: "Av. Arequipa 1500, Lima, Lima",         destination: "Calle San José 200, Arequipa, Arequipa",   weight: 15,  fee: 950,  status: "DELIVERED",  originLat: -12.0464, originLng: -77.0428, destLat: -16.4090, destLng: -71.5375, arrivalYear: 2026, arrivalMonth: 3,  arrivalDay: 8,  clientEmail: "ventas@tecnoglobal.pe",            driverEmail: "miguel@freightflow.com" },
  { tracking: "#00HHIIJJ88", category: "ROPA",        origin: "Av. Los Maestros 300, Ica, Ica",        destination: "Jr. Grau 150, Nazca, Ica",                weight: 50,  fee: 450,  status: "DELIVERED",  originLat: -14.0678, originLng: -75.7286, destLat: -14.8308, destLng: -74.9387, arrivalYear: 2026, arrivalMonth: 3,  arrivalDay: 20, clientEmail: "pedidos@santarosa.pe",             driverEmail: "carmen@freightflow.com" },

  // Aug
  { tracking: "#00IIJJKK99", category: "ALIMENTOS",   origin: "Jr. 28 de Julio 500, Huánuco, Huánuco", destination: "Av. Argentina 2000, Lima, Lima",           weight: 500, fee: 2000, status: "DELIVERED",  originLat: -9.9208,  originLng: -76.2417, destLat: -12.0464, destLng: -77.0428, arrivalYear: 2026, arrivalMonth: 7,  arrivalDay: 12, clientEmail: "contacto@electroworld.pe",        driverEmail: "pedro.d@freightflow.com" },
  { tracking: "#00JJKKLL00", category: "MAQUINARIA",  origin: "Av. La Paz 700, Arequipa, Arequipa",    destination: "Jr. San Martín 400, Juliaca, Puno",        weight: 800, fee: 5000, status: "DELIVERED",  originLat: -16.4090, originLng: -71.5375, destLat: -15.4875, destLng: -70.1292, arrivalYear: 2026, arrivalMonth: 7,  arrivalDay: 29, clientEmail: "info@inversionescusco.pe",        driverEmail: "lucia.v@freightflow.com" },

  // Sep
  { tracking: "#00KKLLMM10", category: "OTROS",       origin: "Av. Balta 200, Chiclayo, Lambayeque",   destination: "Jr. Lima 300, Piura, Piura",               weight: 75,  fee: 600,  status: "DELIVERED",  originLat: -6.7716,  originLng: -79.8409, destLat: -5.1945,  destLng: -80.6328, arrivalYear: 2026, arrivalMonth: 8,  arrivalDay: 10, clientEmail: "pedidos@molinerasur.pe",          driverEmail: "diego@freightflow.com" },
  { tracking: "#00LLMMNN20", category: "ELECTRONICA", origin: "Av. Universitaria 1500, Lima, Lima",    destination: "Av. El Sol 300, Cusco, Cusco",             weight: 30,  fee: 1100, status: "CANCELLED",  originLat: -12.0464, originLng: -77.0428, destLat: -13.5170, destLng: -71.9781, arrivalYear: 2026, arrivalMonth: 8,  arrivalDay: 25, clientEmail: "ventas@ferreteriaconstructor.pe",   driverEmail: "sofia@freightflow.com" },

  // Oct
  { tracking: "#00MMNNOO30", category: "MOBILIARIO",  origin: "Av. Dos de Mayo 150, Tacna, Tacna",     destination: "Jr. Ayacucho 200, Moquegua, Moquegua",     weight: 120, fee: 1300, status: "DELIVERED",  originLat: -18.0083, originLng: -70.2509, destLat: -17.1982, destLng: -70.9374, arrivalYear: 2026, arrivalMonth: 9,  arrivalDay: 5,  clientEmail: "pedidos@embotelladoranorte.pe",    driverEmail: "javier@freightflow.com" },
  { tracking: "#00NNOOPP40", category: "ALIMENTOS",   origin: "Jr. Del Comercio 300, Cajamarca, Cajamarca", destination: "Av. América Sur 500, Trujillo, La Libertad", weight: 180, fee: 1400, status: "DELIVERED",  originLat: -7.1617,  originLng: -78.5123, destLat: -8.1090,  destLng: -79.0215, arrivalYear: 2026, arrivalMonth: 9,  arrivalDay: 22, clientEmail: "info@textilesnorte.pe",           driverEmail: "fernando@freightflow.com" },

  // Nov
  { tracking: "#00OOPPQQ50", category: "ROPA",        origin: "Av. Centenario 400, Pucallpa, Ucayali",  destination: "Av. Abancay 600, Lima, Lima",              weight: 90,  fee: 1800, status: "DELIVERED",  originLat: -8.3791,  originLng: -74.5539, destLat: -12.0464, destLng: -77.0428, arrivalYear: 2026, arrivalMonth: 10, arrivalDay: 14, clientEmail: "logistica@transportesrapidos.pe",   driverEmail: "ricardo@freightflow.com" },
]

// ── Trip Cost Generator ──────────────────────────────────────────

function generateCosts(shipment: { trackingNumber: string; fee: number; weight: number }) {
  const costs: { category: "FUEL" | "TOLL" | "MAINTENANCE" | "PER_DIEM" | "INSURANCE" | "OTHER"; description: string; amount: number }[] = []

  const fuelAmount = Math.round(Math.max(150, shipment.fee * (0.15 + (shipment.trackingNumber.length % 5) * 0.03)) / 10) * 10
  costs.push({ category: "FUEL", description: "Combustible - grifo a lo largo de la ruta", amount: fuelAmount })

  const tollOptions = [15, 20, 25, 35, 45, 60, 80]
  costs.push({ category: "TOLL", description: "Peajes en carretera", amount: tollOptions[shipment.trackingNumber.length % tollOptions.length] })

  const perDiemOptions = [25, 30, 40, 50, 60, 70, 80]
  costs.push({ category: "PER_DIEM", description: "Viáticos del conductor", amount: perDiemOptions[Math.round(shipment.weight) % perDiemOptions.length] })

  if (shipment.weight > 40 || shipment.fee > 1000) {
    const maintAmount = Math.round(Math.max(50, (shipment.fee * 0.04 + shipment.weight * 0.2)) / 10) * 10
    costs.push({ category: "MAINTENANCE", description: "Mantenimiento preventivo del vehículo", amount: Math.min(maintAmount, 500) })
  }

  if (shipment.fee > 2000) {
    const insAmount = Math.round(shipment.fee * 0.025 / 10) * 10
    costs.push({ category: "INSURANCE", description: "Seguro de carga contratado", amount: Math.max(insAmount, 50) })
  }

  return costs
}

// ── Invoice Config ───────────────────────────────────────────────

type InvoiceInput = {
  docType: "FACTURA" | "BOLETA"
  trackingNumber: string
  status: "COBRADA" | "EMITIDA" | "ANULADA"
  issueYear: number; issueMonth: number; issueDay: number
}

// Uses the 20 DELIVERED shipments
const INVOICES_DATA: InvoiceInput[] = [
  { docType: "FACTURA", trackingNumber: "#00AABBCC11", status: "COBRADA",  issueYear: 2026, issueMonth: 0,  issueDay: 20 },
  { docType: "FACTURA", trackingNumber: "#00BBCCDD22", status: "COBRADA",  issueYear: 2026, issueMonth: 0,  issueDay: 30 },
  { docType: "FACTURA", trackingNumber: "#00CCDDEE33", status: "COBRADA",  issueYear: 2026, issueMonth: 1,  issueDay: 15 },
  { docType: "FACTURA", trackingNumber: "#00DDEEFF44", status: "EMITIDA",  issueYear: 2026, issueMonth: 1,  issueDay: 25 },
  { docType: "FACTURA", trackingNumber: "#00EEFFGG55", status: "EMITIDA",  issueYear: 2026, issueMonth: 2,  issueDay: 10 },
  { docType: "FACTURA", trackingNumber: "#00FFGGHH66", status: "EMITIDA",  issueYear: 2026, issueMonth: 2,  issueDay: 20 },
  { docType: "BOLETA",  trackingNumber: "#00GGHHII77", status: "COBRADA",  issueYear: 2026, issueMonth: 3,  issueDay: 12 },
  { docType: "BOLETA",  trackingNumber: "#00HHIIJJ88", status: "COBRADA",  issueYear: 2026, issueMonth: 3,  issueDay: 22 },
  { docType: "FACTURA", trackingNumber: "#001234ABCD", status: "COBRADA",  issueYear: 2026, issueMonth: 4,  issueDay: 22 },
  { docType: "BOLETA",  trackingNumber: "#0089012MNO", status: "COBRADA",  issueYear: 2026, issueMonth: 4,  issueDay: 30 },
  { docType: "FACTURA", trackingNumber: "#0034567MNB", status: "EMITIDA",  issueYear: 2026, issueMonth: 5,  issueDay: 10 },
  { docType: "FACTURA", trackingNumber: "#0045678QWE", status: "EMITIDA",  issueYear: 2026, issueMonth: 5,  issueDay: 15 },
  { docType: "BOLETA",  trackingNumber: "#0067890FGH", status: "EMITIDA",  issueYear: 2026, issueMonth: 5,  issueDay: 20 },
  { docType: "BOLETA",  trackingNumber: "#0012345STU", status: "EMITIDA",  issueYear: 2026, issueMonth: 5,  issueDay: 28 },
  { docType: "BOLETA",  trackingNumber: "#00IIJJKK99", status: "ANULADA",  issueYear: 2026, issueMonth: 7,  issueDay: 15 },
  { docType: "FACTURA", trackingNumber: "#00JJKKLL00", status: "COBRADA",  issueYear: 2026, issueMonth: 7,  issueDay: 30 },
  { docType: "BOLETA",  trackingNumber: "#00KKLLMM10", status: "EMITIDA",  issueYear: 2026, issueMonth: 8,  issueDay: 12 },
  { docType: "FACTURA", trackingNumber: "#00MMNNOO30", status: "COBRADA",  issueYear: 2026, issueMonth: 9,  issueDay: 10 },
  { docType: "BOLETA",  trackingNumber: "#00NNOOPP40", status: "COBRADA",  issueYear: 2026, issueMonth: 9,  issueDay: 25 },
  { docType: "FACTURA", trackingNumber: "#00OOPPQQ50", status: "ANULADA",  issueYear: 2026, issueMonth: 10, issueDay: 18 },
]

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...")
  const password = await bcrypt.hash("admin123", 10)

  // ── 1. Users ──
  console.log("   👤 Creando usuarios...")
  const users = await Promise.all([
    prisma.user.upsert({ where: { email: "admin@freightflow.com" }, update: { name: "Ismael Maddox", password, role: "ADMIN" }, create: { name: "Ismael Maddox", email: "admin@freightflow.com", password, role: "ADMIN" } }),
    prisma.user.upsert({ where: { email: "lucia@freightflow.com" }, update: { name: "Lucía Fernández", password, role: "OPERATOR" }, create: { name: "Lucía Fernández", email: "lucia@freightflow.com", password, role: "OPERATOR" } }),
    prisma.user.upsert({ where: { email: "pedro@freightflow.com" }, update: { name: "Pedro Castillo", password, role: "OPERATOR" }, create: { name: "Pedro Castillo", email: "pedro@freightflow.com", password, role: "OPERATOR" } }),
    prisma.user.upsert({ where: { email: "maria@freightflow.com" }, update: { name: "María Rojas", password, role: "OPERATOR" }, create: { name: "María Rojas", email: "maria@freightflow.com", password, role: "OPERATOR" } }),
  ])
  const admin = users.find(u => u.role === "ADMIN")!

  // ── 2. Drivers ──
  console.log("   🚚 Creando conductores...")
  const drivers = await Promise.all(
    DRIVERS_DATA.map(d =>
      prisma.driver.upsert({
        where: { email: d.email },
        update: { name: d.name, dni: d.dni, phone: d.phone, license: d.license },
        create: { name: d.name, dni: d.dni, email: d.email, phone: d.phone, license: d.license },
      })
    )
  )
  const driverMap = new Map(drivers.map(d => [d.email, d]))

  // ── 3. Clients ──
  console.log("   🏢 Creando clientes...")
  const clients = await Promise.all(
    CLIENTS_DATA.map(c =>
      prisma.client.upsert({
        where: { email: c.email },
        update: { name: c.name, ruc: c.ruc, phone: c.phone, address: c.address },
        create: { name: c.name, ruc: c.ruc, email: c.email, phone: c.phone, address: c.address, createdById: admin.id },
      })
    )
  )
  const clientMap = new Map(clients.map(c => [c.email, c]))

  // ── 4. Clean existing data ──
  console.log("   🧹 Limpiando datos anteriores...")
  await prisma.invoiceShipment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.shipment.deleteMany() // cascades to TripCost
  console.log("   ✅ Datos anteriores eliminados")

  // ── 5. Create Shipments ──
  console.log("   📦 Creando envíos...")
  const shipmentMap = new Map<string, { id: string; trackingNumber: string; clientId: string; fee: number }>()

  for (const s of SHIPMENTS_DATA) {
    const client = clientMap.get(s.clientEmail)
    const driver = s.driverEmail ? driverMap.get(s.driverEmail) : null
    if (!client) {
      console.warn(`   ⚠️  Cliente no encontrado para ${s.clientEmail}, saltando envío ${s.tracking}`)
      continue
    }
    const distance = haversineKm(s.originLat, s.originLng, s.destLat, s.destLng)

    const sh = await prisma.shipment.create({
      data: {
        trackingNumber: s.tracking,
        category: s.category,
        origin: s.origin,
        destination: s.destination,
        weight: s.weight,
        fee: s.fee,
        status: s.status,
        estimatedArrival: new Date(s.arrivalYear, s.arrivalMonth, s.arrivalDay),
        originLat: s.originLat,
        originLng: s.originLng,
        destLat: s.destLat,
        destLng: s.destLng,
        distance,
        clientId: client.id,
        driverId: driver?.id ?? null,
        createdById: admin.id,
      },
    })
    shipmentMap.set(s.tracking, { id: sh.id, trackingNumber: sh.trackingNumber, clientId: sh.clientId, fee: sh.fee })
  }
  console.log(`   ✅ ${shipmentMap.size} envíos creados`)

  // ── 6. Create Trip Costs ──
  console.log("   💰 Creando costos de viaje...")
  let totalCosts = 0
  for (const [, shipment] of shipmentMap) {
    const match = SHIPMENTS_DATA.find(s => s.tracking === shipment.trackingNumber)
    if (!match) continue
    const costEntries = generateCosts({ trackingNumber: shipment.trackingNumber, fee: shipment.fee, weight: match.weight })
    await prisma.tripCost.createMany({
      data: costEntries.map(c => ({
        shipmentId: shipment.id,
        category: c.category,
        description: c.description,
        amount: c.amount,
      })),
    })
    totalCosts += costEntries.length
  }
  console.log(`   ✅ ${totalCosts} costos de viaje creados`)

  // ── 7. Create Invoices ──
  console.log("   🧾 Creando facturas...")
  let facturaCounter = 0
  let boletaCounter = 0
  let invoiceCount = 0

  for (const inv of INVOICES_DATA) {
    const shipment = shipmentMap.get(inv.trackingNumber)
    const client = clients.find(c => c.id === shipment?.clientId)
    if (!shipment || !client) {
      console.warn(`   ⚠️  Envío o cliente no encontrado para factura, saltando`)
      continue
    }

    const counter = inv.docType === "FACTURA" ? ++facturaCounter : ++boletaCounter
    const prefix = inv.docType === "FACTURA" ? "F" : "B"
    const docNumber = `${prefix}-${String(counter).padStart(5, "0")}`
    const subtotal = shipment.fee
    const tax = Math.round(subtotal * 0.18 * 100) / 100
    const total = subtotal + tax

    await prisma.invoice.create({
      data: {
        docType: inv.docType,
        docNumber,
        clientId: client.id,
        issueDate: new Date(inv.issueYear, inv.issueMonth, inv.issueDay),
        subtotal,
        tax,
        total,
        status: inv.status,
        createdById: admin.id,
        shipments: {
          create: [{ shipmentId: shipment.id }],
        },
      },
    })
    invoiceCount++
  }
  console.log(`   ✅ ${invoiceCount} facturas creadas`)

  // ── Summary ──
  console.log("")
  console.log("═══════════════════════════════════════════")
  console.log("   ✅ Seed completado exitosamente!")
  console.log("═══════════════════════════════════════════")
  console.log(`   Usuarios:     ${users.length} (admin@freightflow.com / admin123)`)
  console.log(`   Conductores:  ${drivers.length}`)
  console.log(`   Clientes:     ${clients.length}`)
  console.log(`   Envíos:       ${shipmentMap.size}`)
  console.log(`   Costos:       ${totalCosts}`)
  console.log(`   Facturas:     ${invoiceCount} (${facturaCounter}F + ${boletaCounter}B)`)
  console.log("═══════════════════════════════════════════")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
