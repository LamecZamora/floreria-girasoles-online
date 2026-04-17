import { useOrderNotifications } from "@/hooks/useOrderNotifications";

/** Headless component that wires realtime order notifications. */
const OrderNotifications = () => {
  useOrderNotifications();
  return null;
};

export default OrderNotifications;
