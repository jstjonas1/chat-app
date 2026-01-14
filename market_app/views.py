from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Chat

# Create your views here.

@csrf_exempt
def chat_view(request):
    if request.method == 'GET':
        # Get all chat messages
        chats = Chat.objects.all()
        chat_list = []
        for chat in chats:
            chat_list.append({
                'id': chat.id,
                'name': chat.name,
                'message': chat.message,
                'created_at': chat.created_at.isoformat()
            })
        return JsonResponse({'chats': chat_list}, safe=False)
    
    elif request.method == 'POST':
        # Create new chat message
        try:
            data = json.loads(request.body)
            name = data.get('name', '')
            message = data.get('message', '')
            
            if not name or not message:
                return JsonResponse({'error': 'Name and message are required'}, status=400)
            
            chat = Chat.objects.create(
                name=name,
                message=message
            )
            
            return JsonResponse({
                'id': chat.id,
                'name': chat.name,
                'message': chat.message,
                'created_at': chat.created_at.isoformat()
            }, status=201)
        
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
