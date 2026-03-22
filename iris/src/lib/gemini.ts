import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";

export const IRIS_SYSTEM_INSTRUCTION = `
Você é a Iris, a assistente de voz inteligente e ultra-eficiente do ecossistema SalesMasters.
Sua missão é ajudar lojistas a realizarem pedidos e cotações de forma rápida e natural.

DIRETRIZES:
1. Seja direta, profissional e ágil. Evite introduções longas.
2. Você fala com o lojista. O objetivo é montar um carrinho de compras.
3. Sempre que o lojista mencionar um produto, use a ferramenta 'searchProduct' para encontrar a correspondência exata ou opções.
4. Após encontrar o produto, informe o preço e EMBALAGEM, e pergunte a quantidade.
5. Use 'addToCart' para incluir itens no carrinho. Confirme o total parcial após cada adição.
6. Se o lojista disser algo como "pode fechar", "finalizar" ou "enviar", use 'finalizeQuotation'.
7. Você tem acesso aos preços reais e impostos através da busca.
8. Se houver mais de uma indústria no catálogo dele, pergunte de qual ele deseja pedir se não estiver claro.

PERSONA:
- Tom de voz: Premium, inteligente, prestativo.
- Assuma que o lojista está ocupado e quer rapidez.
- Se não encontrar um produto, sugira algo similar ou peça para ele ser mais específico.
`;

export const irisTools = [
  {
    name: "searchProduct",
    description: "Busca um produto no catálogo da indústria pelo nome popular (conversão) ou código.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Termo de busca (ex: 'cadeira paris', 'mesa bistro').",
        },
        industria_id: {
            type: Type.NUMBER,
            description: "Opcional. ID da indústria se o usuário especificou."
        }
      },
      required: ["query"],
    },
  },
  {
    name: "addToCart",
    description: "Adiciona um produto encontrado ao carrinho do lojista.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        pro_id: { type: Type.NUMBER },
        pro_codprod: { type: Type.STRING },
        pro_nome: { type: Type.STRING },
        quantidade: { type: Type.NUMBER },
        preco_unitario: { type: Type.NUMBER },
        itab_ipi: { type: Type.NUMBER, description: "Opcional. Valor do IPI se disponível." }
      },
      required: ["pro_id", "pro_codprod", "pro_nome", "quantidade", "preco_unitario"],
    },
  },
  {
    name: "finalizeQuotation",
    description: "Finaliza o pedido atual e envia a cotação para o representante.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        observacao: { type: Type.STRING, description: "Observação final para o representante." }
      }
    }
  }
];

export class AudioHandler {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStream | null = null;
  private nextStartTime: number = 0;

  async startCapture(onAudioData: (base64: string) => void) {
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.source = await navigator.mediaDevices.getUserMedia({ audio: true });
    const input = this.audioContext.createMediaStreamSource(this.source);
    
    // Using ScriptProcessor for simplicity
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }
      const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
      onAudioData(base64);
    };

    input.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stopCapture() {
    this.source?.getTracks().forEach(t => t.stop());
    this.processor?.disconnect();
    this.audioContext?.close();
  }

  playChunk(base64: string) {
    if (!this.audioContext) this.audioContext = new AudioContext({ sampleRate: 24000 });
    
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    
    const pcm = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) float32[i] = pcm[i] / 0x7FFF;

    const buffer = this.audioContext.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;
    if (this.nextStartTime < now) this.nextStartTime = now;
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }
}
