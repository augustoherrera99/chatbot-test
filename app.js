const axios = require('axios').default;
//const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { createBot, createProvider, createFlow, addKeyword, MemoryDB, EVENTS } = require('@builderbot/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
//const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const { BaileysProvider } = require('@builderbot/provider-baileys')
//const MockAdapter = require('@bot-whatsapp/database/mock')

// --- TIMEOUT EN MILISEGUNDOS ---
const TIMEOUT_ASESOR = 1 * 60 * 1000 // 10 minutos

const flujoProductos = addKeyword('1') //###1_Productos###
.addAnswer('Consultando items en la base de datos...',
null,
async (ctx, { flowDynamic }) => {
    let contador = 1
    const respuesta = await axios('https://fakestoreapi.com/products');

    for (const item of respuesta.data) {
        if (contador > 4) break;
        contador++;
        await flowDynamic([{ body: item.title, media: item.image }])
    }
})
.addAnswer('Si queres retornar al menú, ingresa 9️⃣\n\nSi queres dar por finalizada la conversación, ingresa 0️⃣',
{ capture: true },
async (ctx, { state, gotoFlow, fallBack, endFlow }) => {
    await state.update({ asesorTimer: Date.now() });
    if (ctx.body === '9') return gotoFlow(flujoPrincipal, 1);
    else if (ctx.body === '0') return gotoFlow(flujoSalir);
    else return fallBack('Esa opción no es válida. Ingresa una de las opciones mencionadas.');
});

const flujoPrecios = addKeyword('2') //###2_Precios###
.addAnswer('Consultando items en la base de datos...',
null,
async (ctx, { flowDynamic }) => {
    let contador = 1
    const respuesta = await axios('https://fakestoreapi.com/products');

    for (const item of respuesta.data) {
        if (contador > 4) break;
        contador++;
        await flowDynamic([{ body: `${item.title} - $${item.price}`, media: item.image }])
    }
})
.addAnswer('Si queres retornar al menú, ingresa 9️⃣\n\nSi queres dar por finalizada la conversación, ingresa 0️⃣',
{ capture: true },
async (ctx, { state, gotoFlow, fallBack, endFlow }) => {
    await state.update({ asesorTimer: Date.now() });
    if (ctx.body === '9') return gotoFlow(flujoPrincipal, 1);
    else if (ctx.body === '0') return gotoFlow(flujoSalir);
    else return fallBack('Esa opción no es válida. Ingresa una de las opciones mencionadas.');
});

const flujoHorarios = addKeyword('3') //###3_Horarios###
.addAnswer('🕒 Nuestro horario es de Lunes a Viernes de 9 AM a 6 PM.')
.addAnswer('Si queres retornar al menú, ingresa 9️⃣\n\nSi queres dar por finalizada la conversación, ingresa 0️⃣',
{ capture: true },
async (ctx, { state, gotoFlow, fallBack, endFlow }) => {
    await state.update({ asesorTimer: Date.now() });
    if (ctx.body === '9') return gotoFlow(flujoPrincipal, 1);
    else if (ctx.body === '0') return gotoFlow(flujoSalir);
    else return fallBack('Esa opción no es válida. Ingresa una de las opciones mencionadas.');
});

const flujoUbicacion = addKeyword('4') //###4_Ubicacion###
.addAnswer('📍 Nuestra ubicación es: https://maps.app.goo.gl/ino28c4MM5VjD8Y79')
.addAnswer('Si queres retornar al menú, ingresa 9️⃣\n\nSi queres dar por finalizada la conversación, ingresa 0️⃣',
{ capture: true },
async (ctx, { state, gotoFlow, fallBack, endFlow }) => {
    await state.update({ asesorTimer: Date.now() });
    if (ctx.body === '9') return gotoFlow(flujoPrincipal, 1);
    else if (ctx.body === '0') return gotoFlow(flujoSalir);
    else return fallBack('Esa opción no es válida. Ingresa una de las opciones mencionadas.');
});

// --- FLUJO PARA ENTRAR EN MODO ASESOR ---
const flujoAsesor = addKeyword(['5']) //###5_Asesor###
.addAction(async (ctx, { state, flowDynamic }) => {
await state.update({ modoAsesor: true, asesorTimer: Date.now() });
const modoAsesor = await state.get('modoAsesor');
const asesorTimer = await state.get('asesorTimer');
console.log('en flujo asesor ', modoAsesor, asesorTimer)
await flowDynamic('Te conectamos con un asesor. En breve te estará atendiendo.');
});

const flujoSalir = addKeyword('6') //###6_Salir###
.addAction(async (ctx, { state, endFlow }) => {
    await state.update({ modoAsesor: false, asesorTimer: null });
    console.log('antes de salir', globalThis.USUARIOS_BUILDERBOT)
    // Quitar usuario del array global
    const idx = globalThis.USUARIOS_BUILDERBOT.findIndex(u => u.ctx.from === ctx.from);
    if (idx !== -1) {
        globalThis.USUARIOS_BUILDERBOT.splice(idx, 1);
    }

    console.log('despues de salir', globalThis.USUARIOS_BUILDERBOT)

    return endFlow('👋 Gracias por visitarnos. ¡Hasta luego!')
});

const flujoPrincipal2 = addKeyword(EVENTS.WELCOME)
.addAction(async (ctx, { state, endFlow }) => {
// Inicializa state si es la primera vez
let modoAsesor = await state.get('modoAsesor');
if (typeof modoAsesor === "undefined") {
    modoAsesor = false;
    await state.update({ modoAsesor });
}
console.log(modoAsesor)
// Si está en modo asesor, no muestres el menú ni respondas
if (modoAsesor === true) {
    await state.update({ asesorTimer: Date.now() });
    return endFlow();// Silencia al bot para ese usuario
}
})
.addAction(async (ctx, { state, flowDynamic, endFlow }) => {
    globalThis.USUARIOS_BUILDERBOT = globalThis.USUARIOS_BUILDERBOT || [];
    if (!globalThis.USUARIOS_BUILDERBOT.some(u => u.ctx.from === ctx.from)) {
        globalThis.USUARIOS_BUILDERBOT.push({ ctx, state, flowDynamic, endFlow });
    }
})
.addAnswer('👋 ¡Hola! ¿Cómo puedo ayudarte hoy?')
.addAnswer(
    [
        '1️⃣ Ver productos',
        '2️⃣ Consultar precios',
        '3️⃣ Horarios de atención',
        '4️⃣ Ubicación',
        '5️⃣ Quiero contactar con un asesor',
        '6️⃣ Salir'
    ],
    { capture: true },
    async (ctx, { gotoFlow, endFlow, fallBack }) => {
        const input = ctx.body?.trim();

        switch (input) {
            case '1':
                return gotoFlow(flujoProductos, 0);
            case '2':
                return gotoFlow(flujoPrecios);
            case '3':
                return gotoFlow(flujoHorarios);
            case '4':
                return gotoFlow(flujoUbicacion);
            case '5':
                return gotoFlow(flujoAsesor);
            case '6':
                return gotoFlow(flujoSalir);
            default:
                console.log(ctx)
                return fallBack('❌ Esa opción no es válida. Por favor, volvé a escribir un número del menú.');
        }
    }
);

const flujoPrincipal = addKeyword(EVENTS.WELCOME)
.addAction(async (ctx, { state, endFlow }) => {
// Inicializa state si es la primera vez
let modoAsesor = await state.get('modoAsesor');
if (typeof modoAsesor === "undefined") {
    modoAsesor = false;
    await state.update({ modoAsesor });
}
// Si está en modo asesor, no muestres el menú ni respondas
if (modoAsesor === true) {
    //await state.update({ asesorTimer: Date.now() });
    return endFlow();// Silencia al bot para ese usuario
}

await state.update({ asesorTimer: Date.now() });
})
.addAction(async (ctx, { state, flowDynamic, endFlow }) => {
    globalThis.USUARIOS_BUILDERBOT = globalThis.USUARIOS_BUILDERBOT || [];
    if (!globalThis.USUARIOS_BUILDERBOT.some(u => u.ctx.from === ctx.from)) {
        globalThis.USUARIOS_BUILDERBOT.push({ ctx, state, flowDynamic, endFlow });
    }
})
.addAnswer('👋 ¡Hola! ¿Cómo puedo ayudarte hoy?')
.addAnswer(
    [
        '1️⃣ Ver productos',  
        '2️⃣ Consultar precios',   
        '3️⃣ Horarios de atención',  
        '4️⃣ Ubicación',  
        '5️⃣ Quiero contactar con un asesor', 
        '6️⃣ Salir'
    ],
    {capture: true},
    async(ctx, {fallBack}) => {

        if(!['1', '2', '3', '4', '5', '6'].includes(ctx.body)){
            return fallBack('Esa opción no es válida. Ingresa una de las opciones del menú.');
        } 
    },
    [flujoProductos, flujoPrecios, flujoHorarios, flujoUbicacion, flujoAsesor, flujoSalir]
)

// --- TIMEOUT DE INACTIVIDAD EN MODO ASESOR ---
setInterval(async () => {
  const usuarios = globalThis.USUARIOS_BUILDERBOT || [];
  const ahora = Date.now();

  for (const usuario of usuarios) {
    const modoAsesor = await usuario.state.get('modoAsesor');
    const asesorTimer = await usuario.state.get('asesorTimer');
    if (asesorTimer && (ahora - asesorTimer > TIMEOUT_ASESOR)) {
        await usuario.state.update({ modoAsesor: false, asesorTimer: null });
        await usuario.endFlow('Por seguridad, termino nuestra conversación. Seguiré acá para ayudarte ¡Saludos! 👋');
        
        // Quitar usuario del array global
        const idx = globalThis.USUARIOS_BUILDERBOT.findIndex(u => u.ctx.from === usuario.ctx.from);
        if (idx !== -1) {
            globalThis.USUARIOS_BUILDERBOT.splice(idx, 1);
        }
    }
  }
}, 60 * 1000); // cada minuto

//const flows = [
//     flujoPrincipal, flujoProductos, flujoPrecios, flujoHorarios, flujoUbicacion, flujoAsesor, flujoSalir
// ];

const flows = [flujoPrincipal]

const main = async () => {
    //const adapterDB = new MockAdapter()
    const adapterDB = new MemoryDB()
    const adapterFlow = createFlow(flows)
    const adapterProvider = createProvider(BaileysProvider)

    const bot = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    const { httpServer } = bot;

    httpServer(3005)
};

main()
