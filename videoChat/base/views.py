from django.shortcuts import render
from agora_token_builder import RtcTokenBuilder
from django.http import JsonResponse
import random
import time
import json
from .models import RoomMember
from django.views.decorators.csrf import csrf_exempt
# Create your views here.

def getToken(request):
    appId = '714b4f2981584f6b9098709f5d18d4be'
    appCertificate = 'e8b2586662b44a8ea7b165577e01d8e2'
    channelName = request.GET.get('channel')
    uid = random.randint(1, 100)
    expirationTimeInSeconds = 3600*24
    currentTimeStamp = time.time()
    privilegeExpiredTs = currentTimeStamp + expirationTimeInSeconds
    role = 1

    token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs)
    return JsonResponse({'token':token, 'uid':uid}, safe=False)

def lobby(request):
    return render(request, 'base/lobby.html')

def room(request):
    return render(request, 'base/room.html')

@csrf_exempt
def createMember(request):
    data = json.loads(request.body)
    member, created = RoomMember.objects.get_or_create(
        name = data['name'],
        uid = data['UID'],
        room_name = data['room_name']
    )
    return JsonResponse({'name': data['name']}, safe=False)



@csrf_exempt
def getMember(request):
    uid = request.GET.get('UID')
    room_name = request.GET.get('room_name')

    member, created = RoomMember.objects.get_or_create(
        uid=uid,
        room_name=room_name,
        defaults={'name': 'Guest'}
    )

    return JsonResponse({'name': member.name})


@csrf_exempt
def deleteMember(request):
    data = json.loads(request.body)
  
    member = RoomMember.objects.get(
        name = data['name'],
        uid = data['UID'],
        room_name = data['room_name'],
    )
    return JsonResponse('Member is deleted', safe=False)
