import { database } from '../billing/database.js';
import { createBillingRouter } from '../billing/router.js';
export default createBillingRouter(database);
