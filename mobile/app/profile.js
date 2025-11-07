// Simplify profile route to avoid redundant redirects on web.
// Tabs already define /tabs/profile which exports ProfileScreen.
// This file should just export the screen directly for /profile.
import ProfileScreen from "../src/screens/ProfileScreen";

export default ProfileScreen;
