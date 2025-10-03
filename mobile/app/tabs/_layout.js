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
  const { orders = [], cart = [] } = useContext(AppCtx);
  const cartItemCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);

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
        headerShown: true,
        headerStyle: { 
          backgroundColor: "#10B981",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
        headerTintColor: "#fff",
        headerTitleStyle: { 
          fontWeight: "700", 
          fontSize: 18, 
          color: "#fff" 
        },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.6)",
        tabBarStyle: {
          backgroundColor: "#10B981",
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: { 
          fontSize: 11, 
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home-outline" color={color} size={size + 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="grid-outline" color={color} size={size + 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
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
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="receipt-outline" color={color} size={size + 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="heart-outline" color={color} size={size + 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="person-outline" color={color} size={size + 2} />
          ),
        }}
      />
    </Tabs>
  );
}

