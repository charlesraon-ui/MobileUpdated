import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useContext } from "react";
import { Text, View } from "react-native";
import { AppCtx } from "../../src/context/AppContext";

export default function TabsLayout() {
  // Root app layout already wraps with AppProvider.
  // Keep a single provider to ensure unified cart/auth state across routes.
  return <TabsInner />;
}

function TabsInner() {
  const { orders = [], cart = [], wishlist = [], user } = useContext(AppCtx);
  const cartItemCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);
  const wishlistItemCount = user ? wishlist.length : 0; // Only show wishlist count for logged-in users

  // Custom tab bar icon with badge
  const TabBarIcon = ({ name, color, size, badgeCount }) => (
    <View style={{ position: 'relative' }}>
      <Ionicons name={name} color={color} size={size} />
      {badgeCount > 0 && (
        <View style={{
          position: 'absolute',
          right: -8,
          top: -4,
          backgroundColor: '#EF4444',
          borderRadius: 10,
          minWidth: 20,
          height: 20,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 4,
          borderWidth: 2,
          borderColor: '#fff',
        }}>
          <Text style={{
            color: '#fff',
            fontSize: 10,
            fontWeight: '700',
            lineHeight: 12,
          }}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Minimal config to avoid any style arrays reaching DOM anchors on web.
        tabBarActiveTintColor: "#10B981",
        tabBarInactiveTintColor: "#9CA3AF",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home-outline" color={color} size={size + 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarLabel: "Products",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="grid-outline" color={color} size={size + 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarLabel: "Cart",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon 
              name="bag-outline" 
              color={color} 
              size={size + 2} 
              badgeCount={cartItemCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarLabel: "Wishlist",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon 
              name="heart-outline" 
              color={color} 
              size={size + 2} 
              badgeCount={wishlistItemCount}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="person-outline" color={color} size={size + 2} />
          ),
        }}
      />
    </Tabs>
  );
}

