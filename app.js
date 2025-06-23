const axios = require('axios').default;
const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')

/*
Inputs addAnswer
* const A = Obligatorio: un texto "hola", array ["hola", "como estas"]
* const B = Opcional null: es un objeto {media, delay, capture, buttons}
* const C = Opcional null: es una función callBack function que se ejecuta una vez se produce la respuesta del bot
* const D = Opcional: es un array de flujos hijos
*/

const flowSaludos = addKeyword(EVENTS.WELCOME).addAnswer('¡Hola! Soy Tymo, tu asistente virtual. ¡Bienvenido!', 
    {
        media: "https://bot-whatsapp.netlify.app/build/q-76efce59.avif"
    }
)
const flowNotaVoz = addKeyword(EVENTS.VOICE_NOTE).addAnswer('Mi programador es tan vago que todavía no sé escuchar notas de voz. \n\nPrueba nuevamente cuando esté disponible la funcionalidad.')
const flowUbicacion = addKeyword(EVENTS.LOCATION).addAnswer('Mi programador es tan vago que todavía no entiendo las ubicaciones. \n\nPrueba nuevamente cuando esté disponible la funcionalidad.')
const flowEnvioImg_Vid = addKeyword(EVENTS.MEDIA).addAnswer('Mi programador es tan vago que todavía no sé interpretar imagenes o vídeos. \n\nPrueba nuevamente cuando esté disponible la funcionalidad.')
const flowEnvioDoc = addKeyword(EVENTS.DOCUMENT).addAnswer('Mi programador es tan vago que todavía no sé leer documentos. \n\nPrueba nuevamente cuando esté disponible la funcionalidad.')

const REGEX_EMAIL = "/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/g";

const flowEmail = addKeyword(REGEX_EMAIL, { regex: true })
.addAnswer("Email valido")
.addAnswer("Adios!");

const flujoProductos = addKeyword('1')
.addAnswer('Consultando items en la base de datos...',
null,
async (ctx, {flowDynamic}) => {
    let contador = 1
    const respuesta = await axios('https://fakestoreapi.com/products');
    
    for (const item of respuesta.data) {
        if(contador > 4) break;
        contador++;
        await flowDynamic([{ body:item.title, media:item.image }])
    }
})
.addAnswer('Si queres retornar al menú, ingresa 9️⃣',
{capture: true},
async(ctx, {gotoFlow}) => {
    if(ctx.body === '9') return gotoFlow(flujoPrincipal, 1);
});

const flujoPrecios = addKeyword('2')
.addAnswer('Consultando items en la base de datos...',
null,
async (ctx, {flowDynamic}) => {
    let contador = 1
    const respuesta = await axios('https://fakestoreapi.com/products');
    
    for (const item of respuesta.data) {
        if(contador > 4) break;
        contador++;
        await flowDynamic([{body:`${item.title} - $${item.price}`, media:item.image}])
    }
})
.addAnswer('Si queres retornar al menú, ingresa 9️⃣',
{capture: true},
async(ctx, {gotoFlow}) => {
    if(ctx.body === '9') return gotoFlow(flujoPrincipal, 1);
});

const flujoHorarios = addKeyword('3')
.addAnswer('🕒 Nuestro horario es de Lunes a Viernes de 9 AM a 6 PM.')
.addAnswer('Si queres retornar al menú, ingresa 9️⃣',
{capture: true},
async(ctx, {gotoFlow}) => {
    if(ctx.body === '9') return gotoFlow(flujoPrincipal, 1);
});

const flujoUbicacion = addKeyword('4')
.addAnswer('📍 Nuestra ubicación es: [https://maps.app.goo.gl/G456vcmH5gu1eijc7]')
.addAnswer('Si queres retornar al menú, ingresa 9️⃣',
{capture: true},
async(ctx, {gotoFlow}) => {
    if(ctx.body === '9') return gotoFlow(flujoPrincipal, 1);
});

const flujoAsesor = addKeyword('5')
.addAnswer(" ",
    {
        media: "https://i.pinimg.com/736x/df/02/54/df02548c490da918222d6dbe42289aef.jpg"
    }
)
.addAnswer('Si queres retornar al menú, ingresa 9️⃣',
{capture: true},
async(ctx, {gotoFlow}) => {
    if(ctx.body === '9') return gotoFlow(flujoPrincipal, 1);
});

const flujoSalir = addKeyword('6')
.addAnswer('👋 Gracias por visitarnos. ¡Hasta luego!');

const flujoPrincipal = addKeyword('Hola')
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
        if(!['1', '2', '3', '4', '5', '6'].includes(ctx.body)) return fallBack('Esa opción no es válida. Ingresa una de las opciones del menú.');
    },
    [flujoProductos, flujoPrecios, flujoHorarios, flujoUbicacion, flujoAsesor, flujoSalir]
)

const flujoAPI = addKeyword('API')
.addAnswer('Bienvenido a mi e-commerce a continuación puede ver una lista de productos',
    {
        buttons: [
            {
                body: '😃 Ver Productos'
            }
        ]
    },
    null,
    [flujoProductos]
)

const flujoMultimedia = addKeyword('hola')
.addAnswer("Te envio un archivo",
    {
        media: "ruta archivo" // colocar url pública de archivo imagen, video, audio o pdf
    }
)

const flowDespedida = addKeyword('chau', 'adios', 'chao').addAnswer('Adios! Gracias por comunicarte.');

const flows = [
flujoPrincipal, flowNotaVoz, flowUbicacion, flowEnvioImg_Vid, flowEnvioDoc
];

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow(flows)
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
