// Add this import at the top of AppProvider.js:
import { connectSocket, disconnectSocket } from "../api/socketClient";

// Add this useEffect inside AppProvider component (after the boot useEffect):

useEffect(() => {
  let socket = null;

  const setupRealtimeUpdates = async () => {
    // Only connect if user is logged in
    if (!isLoggedIn) {
      disconnectSocket();
      return;
    }

    try {
      socket = await connectSocket();

      // 📦 New product created
      socket.on("inventory:created", (data) => {
        console.log("📦 New product:", data.name);
        setProducts((prev) => [data, ...prev]);
      });

      // 🔄 Product updated (stock, price, etc.)
      socket.on("inventory:update", (data) => {
        console.log("🔄 Product updated:", data.productId);
        
        // Update products list
        setProducts((prev) =>
          prev.map((p) =>
            p._id === data.productId ? { ...p, ...data } : p
          )
        );

        // Update cart if this product is in cart
        setCart((prev) =>
          prev.map((item) =>
            item.productId === data.productId
              ? { 
                  ...item, 
                  price: data.price ?? item.price,
                  name: data.name ?? item.name 
                }
              : item
          )
        );

        // Update product detail if currently viewing
        if (productDetail?._id === data.productId) {
          setProductDetail((prev) => ({ ...prev, ...data }));
        }
      });

      // 🗑️ Product deleted
      socket.on("inventory:deleted", (data) => {
        console.log("🗑️ Product deleted:", data.productId);
        
        setProducts((prev) =>
          prev.filter((p) => p._id !== data.productId)
        );

        // Remove from cart
        setCart((prev) =>
          prev.filter((item) => item.productId !== data.productId)
        );

        // Clear detail view if deleted
        if (productDetail?._id === data.productId) {
          setProductDetail(null);
        }
      });

      // 📊 Bulk inventory update (from audit)
      socket.on("inventory:bulk", (updates) => {
        console.log("📊 Bulk update:", updates.length, "products");
        
        setProducts((prev) => {
          const updated = [...prev];
          updates.forEach((u) => {
            const idx = updated.findIndex((p) => p._id === u.productId);
            if (idx > -1) {
              updated[idx] = { ...updated[idx], ...u };
            }
          });
          return updated;
        });
      });

    } catch (error) {
      console.warn("Socket setup failed:", error?.message);
    }
  };

  setupRealtimeUpdates();

  // Cleanup
  return () => {
    if (socket) {
      socket.off("inventory:created");
      socket.off("inventory:update");
      socket.off("inventory:deleted");
      socket.off("inventory:bulk");
    }
    
    // Disconnect when user logs out
    if (!isLoggedIn) {
      disconnectSocket();
    }
  };
}, [isLoggedIn, productDetail?._id]);

// That's it! Your mobile app now has real-time product updates 🎉