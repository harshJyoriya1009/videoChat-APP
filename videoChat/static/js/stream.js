const APP_ID = '714b4f2981584f6b9098709f5d18d4be'
const CHANNEL = sessionStorage.getItem('room')
const TOKEN = sessionStorage.getItem('token')
let UID = Number(sessionStorage.getItem('UID'))

let NAME = sessionStorage.getItem('name')

console.log('Streams.js connected')


const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });


let localTracks = []
let remoteUsers = {}

let joinAndDisplayLocalStream = async () => {
    document.getElementById('room-name').innerText = CHANNEL

    client.on('user-published', handleUserJoined)
    client.on('user-left', handleUserLeft)

    try{
        await client.join(APP_ID, CHANNEL, TOKEN, UID)

    }catch(error){
        console.log(error)
        window.open('/', '_self')
    }

    
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()
    
    let member = await createMember()    // -------------------------------------------------------------------------------------
    
    let player = `<div id="user-container-${UID}" class="video-container">
                        <div class="username-wrapper"><span class='user-name'>${member.name}</span></div>
                     <div class="video-player" id="user-${UID}"></div>
                   </div>`

    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

    localTracks[1].play(`user-${UID}`)

    await client.publish([localTracks[0], localTracks[1]])
}

let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user
    await client.subscribe(user, mediaType)

    if(mediaType === 'video'){
        let player = document.getElementById(`user-container-${user.uid}`)
        if(player != null){
            player.remove()
        }

        let member = await getMember(user)
        
         player = `<div id="user-container-${user.uid}" class="video-container">
                    <div class='username-wrapper'><span class='user-name'>${member.name}</span></div>
                     <div class="video-player" id="user-${user.uid}"></div>
                   </div>`

    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
    user.videoTrack.play(`user-${user.uid}`)
    }

    if(mediaType === 'audio'){
        user.audioTrack.play()
    }

}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let letAndRemoveLocalStream = async () => {
    for(i=0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.leave()
    deleteMember()
    window.open('/', '_self')
}

let toggleCamera = async (e) => {
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        e.target.style.backgroundColor = '#fff'
    }else{
        await localTracks[1].setMuted(true)
        e.target.style.backgroundColor = 'red'
    }
}

let toggleMic = async (e) => {
    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        e.target.style.backgroundColor = '#fff'
    }else{
        await localTracks[0].setMuted(true)
        e.target.style.backgroundColor = 'red'
    }
}

let createMember = async () =>{
    let response = await fetch('/create_member/', {
        method: "POST",
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({'name': NAME, 'room_name': CHANNEL, 'UID': UID})
    })
    let member = await response.json()
    return member
}

let getMember = async (user) =>{
    let response = await fetch(`/get_member/?UID=${user.uid}&room_name=${CHANNEL}`)
    let member = await response.json()
    return member
}

let deleteMember = async () =>{
    let response = await fetch('/delete_member/', {
        method: "POST",
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({'name': NAME, 'room_name': CHANNEL, 'UID': UID})
    })
    let member = await response.json()
}


joinAndDisplayLocalStream()

document.getElementById('leave-btn').addEventListener('click', letAndRemoveLocalStream)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)

