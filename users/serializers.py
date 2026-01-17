from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    # Write only means we can send it, but the API won't send it back (security)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'name', 'password']

    def create(self, validated_data):
        # We override create to use 'create_user' (which hashes the password)
        # instead of the default 'create' (which would store it plain text).
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data.get('name', '')
        )
        
        # Create a token immediately so they can log in right away
        Token.objects.create(user=user)
        
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)