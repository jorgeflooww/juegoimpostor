## server.js

```javascript
// server.js — Node.js WebSocket server
// Requiere: npm install ws

const WebSocket = require('ws')
const PORT = process.env.PORT || 8080
const wss = new WebSocket.Server({ port: PORT })

console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`)

// rooms: { code: { players: [{id,name,color}], hostSocket, word, impostorPct } }
const rooms = new Map()

function makeCode(len=5){
const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
let s = ''
for(let i=0;i<len;i++) s += chars[Math.floor(Math.random()*chars.length)]
return s
}

function broadcastToRoom(code, msg){
const room = rooms.get(code)
if(!room) return
const payload = JSON.stringify(msg)
room.sockets.forEach(ws=>{ if(ws.readyState===WebSocket.OPEN) ws.send(payload) })
}

wss.on('connection', (ws)=>{
ws.meta = { room: null, uid: null }

ws.on('message', (raw)=>{
let msg
try{ msg = JSON.parse(raw) }catch(e){ return }
const {type, data} = msg

if(type === 'create_room'){
let code
do { code = makeCode() } while (rooms.has(code))
const room = { code, players: [], sockets: new Set(), host: ws, word: data.word || null, impostorPct: data.impostorPct || 14 }
room.sockets.add(ws)
rooms.set(code, room)
ws.meta.room = code
ws.meta.uid = data.player.id
room.players.push({ id:data.player.id, name:data.player.name, color:data.player.color, revealed:false, isImpostor:false })
ws.send(JSON.stringify({type:'room_created', data:{code, room}}))
}

else if(type === 'join_room'){
const code = (data.code||'').toUpperCase()
const room = rooms.get(code)
if(!room){ ws.send(JSON.stringify({type:'error', data:{message:'Sala no encontrada'}})); return }
ws.meta.room = code
ws.meta.uid = data.player.id
room.sockets.add(ws)
room.players.push({ id:data.player.id, name:data.player.name, color:data.player.color, revealed:false, isImpostor:false })
```
