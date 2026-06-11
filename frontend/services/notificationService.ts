import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export async function registerForPushNotifications() {
    if (!Device.isDevice) {
        console.log("Must use physical device");
        return null;
    }

    const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } =
            await Notifications.requestPermissionsAsync();

        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        return null;
    }

    const tokenData =
        await Notifications.getExpoPushTokenAsync();

    const token = tokenData.data;

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(
            "default",
            {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
            }
        );
    }

    return token;
}