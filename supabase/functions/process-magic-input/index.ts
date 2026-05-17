/// <reference lib="dom" />
// @ts-ignore: O Deno suporta o protocolo jsr nativamente, isso evita erros visuais no VS Code
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Declara o objeto Deno para que o TypeScript padrão do VS Code não aponte erro
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    console.log(`Processing text: ${text}`)

    const mockParsed = {
      valor: 50.00,
      descricao: "Almoco Inteligente",
      tipo: "saida",
      categoria_nome: "Alimentacao",
      data: new Date().toISOString().split('T')[0]
    }

    return new Response(
      JSON.stringify(mockParsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
