from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, get_user_model
from rest_framework.authtoken.models import Token
from django.db import transaction
from .serializers import UserRegistrationSerializer, LoginSerializer
from rest_framework.permissions import AllowAny

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        # This will automatically return HTTP 400 if validation fails
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                # 1. Create the User
                user = serializer.save()
                
                # 2. Create the Token
                token, _ = Token.objects.get_or_create(user=user)

                return Response({
                    'token': token.key,
                    'user_id': user.pk,
                    'username': user.username,
                    'email': user.email
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Transaction failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        # Automatically returns 400 if username/password fields are missing
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        user = authenticate(username=username, password=password)
        
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'name': getattr(user, 'name', '')
            }, status=status.HTTP_200_OK)
        
        return Response(
            {'error': 'Invalid Credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )