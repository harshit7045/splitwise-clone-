import { Redirect } from 'expo-router';

export default function Index() {
    // Logic to check if user is logged in could go here
    return <Redirect href="/login" />;
}
