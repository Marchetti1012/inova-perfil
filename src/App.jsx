import { useState, useRef } from "react";

// ─── CORES OFICIAIS — MANUAL DE IDENTIDADE VISUAL ───────────────────────────
const R  = "#FF0000";   // Vermelho vivo   · RGB R255 G0   B0
const RD = "#A30810";   // Vermelho escuro · RGB R163 G8   B16
const CZ = "#605D5C";   // Cinza oficial   · RGB R96  G93  B92
const BG = "#EBEBEB";   // Fundo cinza claro
const WH = "#FFFFFF";

const FONT      = "'Arial Black', 'Arial Bold', Arial, sans-serif";
const FONT_BODY = "'Arial Narrow', Arial, sans-serif";

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

const PROFILES = {
  Gestor:                 { icon: "⚙️",  accent: "#1D4ED8", bg: "#EFF6FF", border: "#93C5FD" },
  Investidor:             { icon: "📈",  accent: "#B45309", bg: "#FFFBEB", border: "#FCD34D" },
  Operacional:            { icon: "🏪",  accent: "#6D28D9", bg: "#F5F3FF", border: "#C4B5FD" },
  "Técnico/Farmacêutico": { icon: "💊",  accent: "#065F46", bg: "#ECFDF5", border: "#6EE7B7" },
};
const FUNIL = {
  "Lead exploratório": { step:1, color: CZ       },
  "Lead qualificado":  { step:2, color: "#1D4ED8" },
  "Lead prioritário":  { step:3, color: "#B45309" },
  "Lead em decisão":   { step:4, color: "#065F46" },
};
const AREAS = {
  Comercial: "💰", Marca: "🎨", Gestão: "📊", Fidelização: "❤️",
};
const EXPERIENCIA = {
  "Empreendedor iniciante":         { step:1, icon:"🌱" },
  "Dono de farmácia em operação":   { step:2, icon:"🏪" },
  "Empresário com múltiplas lojas": { step:3, icon:"🏢" },
};

// ─── COMPONENTES BASE ────────────────────────────────────────────────────────
function SecBar({ children, color=RD }) {
  return (
    <div style={{
      background:`linear-gradient(90deg,${color} 0%,${color === RD ? R : color} 100%)`,
      padding:"8px 18px", display:"flex", alignItems:"center", gap:8,
    }}>
      <span style={{ color:WH, fontSize:10, fontWeight:900, letterSpacing:2.5, fontFamily:FONT, textTransform:"uppercase" }}>
        {children}
      </span>
    </div>
  );
}

function Faixas({ n=4, opacity=0.15 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {Array.from({length:n}).map((_,i)=>(
        <div key={i} style={{ height:7, background:R, opacity }} />
      ))}
    </div>
  );
}

function Card({ children, accent=RD, style={} }) {
  return (
    <div style={{
      background:WH, borderLeft:`4px solid ${accent}`,
      border:`1px solid #D1D5DB`, borderLeft:`4px solid ${accent}`, ...style,
    }}>{children}</div>
  );
}

function BtnInova({ onClick, disabled, children, full=false, outline=false, small=false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: full?"100%":"auto",
      padding: small?"8px 16px":"13px 28px",
      background: outline ? WH : `linear-gradient(90deg,${RD},${R})`,
      color: outline ? RD : WH,
      border: outline ? `2px solid ${R}` : "none",
      cursor: disabled?"not-allowed":"pointer",
      opacity: disabled?0.5:1,
      fontSize: small?10:11, fontWeight:900, fontFamily:FONT,
      letterSpacing:2, textTransform:"uppercase",
    }}>{children}</button>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function InovaPerfilCliente() {
  const [step,setStep]                           = useState("form");
  const [form,setForm]                           = useState({ nome:"",codigo:"",tamanho:"",transcricao:"" });
  const [resultado,setResultado]                 = useState(null);
  const [erro,setErro]                           = useState("");
  const [abaAtiva,setAbaAtiva]                   = useState("perfil");
  const [onboarding,setOnboarding]               = useState(null);
  const [loadingOnboarding,setLoadingOnboarding] = useState(false);
  const [erroOnboarding,setErroOnboarding]       = useState("");
  const fileRef = useRef();

  function handleField(e){ setForm({...form,[e.target.name]:e.target.value}); }

  async function handleFile(e) {
    const file = e.target.files[0]; if(!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if(ext==="docx"||ext==="pdf"){
      setErro("⚠️ Para .docx ou .pdf: abra o arquivo, selecione tudo (Ctrl+A), copie e cole no campo abaixo.");
      return;
    }
    setErro(""); setForm({...form, transcricao: await file.text()});
  }

  async function analisar() {
    if(!form.transcricao.trim()){ setErro("Cole ou faça upload da transcrição da reunião."); return; }
    setErro(""); setStep("loading");
    const prompt=`Você é um especialista em análise de perfil de franqueados para a Rede Inova Drogarias.
Analise a transcrição abaixo e retorne JSON. Responda APENAS com JSON válido, sem texto extra, sem markdown.
Dados do lead:
- Nome: ${form.nome||"Não informado"}
- Código da loja: ${form.codigo||"Não informado"}
- Tamanho da farmácia: ${form.tamanho||"Não informado"}
Transcrição:
${form.transcricao}
Retorne neste formato:
{"perfil_principal":"<Gestor|Investidor|Operacional|Técnico/Farmacêutico>","perfil_secundario":"<idem>","justificativa_perfil":"<2-3 frases>","nivel1_interesse":"<Comercial|Marca|Gestão|Fidelização>","nivel1_justificativa":"<1 frase>","nivel2_experiencia":"<Empreendedor iniciante|Dono de farmácia em operação|Empresário com múltiplas lojas>","nivel2_justificativa":"<1 frase>","nivel3_rid":{"potencial_investimento":"<Alto|Médio|Baixo>","estrutura_equipe":"<Forte|Adequada|Precisa desenvolver>","estrutura_estoque":"<Bem estruturado|Médio|Precisa desenvolver>","aderencia_rede":"<Alta|Média|Baixa>","score_geral":"<0-100>","observacao":"<1-2 frases>"},"nivel4_funil":"<Lead exploratório|Lead qualificado|Lead prioritário|Lead em decisão>","nivel4_justificativa":"<1 frase>","abordagem_recomendada":"<3-5 frases>","pontos_atencao":["<p1>","<p2>","<p3>"],"proximos_passos":["<p1>","<p2>","<p3>"],"frase_chave":"<frase curta>"}`;
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]}),
      });
      const data=await res.json();
      if(data.error) throw new Error(data.error.message||"Erro da API");
      const raw=data.content?.map(b=>b.text||"").join("")||"";
      if(!raw) throw new Error("Resposta vazia");
      const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
      setResultado({...parsed,nome:form.nome,codigo:form.codigo,tamanho:form.tamanho});
      setStep("result");
    } catch(e){ setErro("Erro: "+(e?.message||String(e))); setStep("form"); }
  }

  function reiniciar(){
    setStep("form"); setResultado(null); setOnboarding(null);
    setAbaAtiva("perfil"); setErroOnboarding("");
    setForm({nome:"",codigo:"",tamanho:"",transcricao:""});
  }

  async function gerarOnboarding(res) {
    setLoadingOnboarding(true); setErroOnboarding(""); setAbaAtiva("onboarding");
    const prompt=`Você é especialista em onboarding de licenciados da Rede Inova Drogarias.
PERFIL: Nome=${res.nome||"?"} · Perfil=${res.perfil_principal}/${res.perfil_secundario} · Interesse=${res.nivel1_interesse} · Experiência=${res.nivel2_experiencia} · Funil=${res.nivel4_funil} · Score=${res.nivel3_rid?.score_geral}/100 · Aderência=${res.nivel3_rid?.aderencia_rede} · Farmácia=${res.tamanho||"?"} · Justificativa=${res.justificativa_perfil}
FILOSOFIA: O kick-off NÃO apresenta ferramentas. É encantamento. Conta a história da rede, mostra a transformação. Como entregar a chave de um apartamento — mostra os cômodos com emoção, não explica que o quarto é para dormir. Filosofia: "Não vamos soltar a mão dele".
PILARES: Bandeiramento · Fachada/Identidade Visual · Comercial · Marketing · Aceleração · Evento
Responda APENAS com JSON válido:
{"abertura_encantamento":"<3-4 frases como abrir o kick-off>","historia_da_rede":"<2-3 frases como contar a história>","ordem_pilares":[{"pilar":"<nome>","prioridade":"<Alta|Média|Baixa>","por_que":"<razão>","como_apresentar":"<benefício/resultado, sem ferramenta>"}],"linguagem_ideal":"<tom, vocab, o que usar/evitar>","desafios_antecipados":[{"desafio":"<desafio>","como_contornar":"<estratégia>"}],"momentos_criticos":"<quando pode desengajar e como agir>","como_manter_vinculo":"<frequência, canal, tipo de contato>","frase_abertura_kickoff":"<frase exata para abrir>"}`;
    try {
      const res2=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2500,messages:[{role:"user",content:prompt}]}),
      });
      const data=await res2.json();
      if(data.error) throw new Error(data.error.message);
      const raw=data.content?.map(b=>b.text||"").join("")||"";
      setOnboarding(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch(e){ setErroOnboarding("Erro: "+(e?.message||String(e))); }
    finally { setLoadingOnboarding(false); }
  }

  const pp    = resultado && PROFILES[resultado.perfil_principal];
  const ps    = resultado && PROFILES[resultado.perfil_secundario];
  const funil = resultado && FUNIL[resultado.nivel4_funil];
  const exp   = resultado && EXPERIENCIA[resultado.nivel2_experiencia];
  const scoreVal = resultado ? (parseInt(resultado.nivel3_rid?.score_geral)||0) : 0;
  const scoreColor = scoreVal>=70 ? "#065F46" : scoreVal>=40 ? "#B45309" : "#991B1B";

  const inp = {
    width:"100%", padding:"11px 14px", fontSize:13,
    border:`1px solid #D1D5DB`, borderBottom:`2px solid ${CZ}`,
    background:"#FAFAFA", fontFamily:FONT_BODY, color:"#111",
    outline:"none", boxSizing:"border-box", borderRadius:0,
  };
  const lbl = {
    display:"block", fontSize:10, fontWeight:900, color:CZ,
    letterSpacing:2, textTransform:"uppercase", fontFamily:FONT, marginBottom:5,
  };

  return (
    <div style={{ minHeight:"100vh", background:BG, fontFamily:FONT_BODY }}>

      {/* HEADER */}
      <header style={{ background:RD, borderBottom:`4px solid ${R}` }}>
        <div style={{ display:"flex" }}>
          {[R,"#C20000",RD,"#8A0007","#6A0005"].map((c,i)=>(
            <div key={i} style={{ flex:1, height:5, background:c }} />
          ))}
        </div>
        <div style={{ maxWidth:900, margin:"0 auto", padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{
              width:44, height:44, background:R, flexShrink:0,
              clipPath:"polygon(12% 0%,88% 0%,100% 12%,100% 88%,88% 100%,12% 100%,0% 88%,0% 12%)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <span style={{ color:WH, fontSize:22, fontWeight:900, fontFamily:FONT, fontStyle:"italic" }}>i</span>
            </div>
            <div>
              <div style={{ color:"rgba(255,255,255,0.6)", fontSize:9, fontWeight:900, letterSpacing:3, fontFamily:FONT }}>REDE</div>
              <div style={{ color:WH, fontSize:22, fontWeight:900, letterSpacing:1, fontFamily:FONT, fontStyle:"italic", lineHeight:1.05 }}>INOVA</div>
              <div style={{ color:"rgba(255,255,255,0.6)", fontSize:9, fontWeight:900, letterSpacing:3, fontFamily:FONT }}>DROGARIAS</div>
            </div>
            <div style={{ width:1, height:38, background:"rgba(255,255,255,0.2)", margin:"0 8px" }} />
            <div>
              <div style={{ color:WH, fontSize:11, fontWeight:900, letterSpacing:1.5, fontFamily:FONT }}>SISTEMA DE IDENTIFICAÇÃO</div>
              <div style={{ color:"rgba(255,255,255,0.55)", fontSize:10, letterSpacing:.5 }}>Perfil do Cliente · Gerente de Sucesso</div>
            </div>
          </div>
          {step==="result" && <BtnInova onClick={reiniciar} outline small>← Nova Análise</BtnInova>}
        </div>
      </header>

      <main style={{ maxWidth:900, margin:"0 auto", padding:"28px 24px" }}>

        {/* ════ FORMULÁRIO ══════════════════════════════════════════════════ */}
        {step==="form" && (
          <div>
            <div style={{ marginBottom:22 }}><Faixas n={3} opacity={.12} /></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
              <Card accent={RD}>
                <SecBar>Dados do Lead</SecBar>
                <div style={{ padding:18, display:"flex", flexDirection:"column", gap:12 }}>
                  <div>
                    <label style={lbl}>Nome do Cliente</label>
                    <input name="nome" value={form.nome} onChange={handleField} placeholder="Ex: João da Silva" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Código da Loja</label>
                    <input name="codigo" value={form.codigo} onChange={handleField} placeholder="Ex: RID-0042" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Situação da Farmácia</label>
                    <select name="tamanho" value={form.tamanho} onChange={handleField} style={inp}>
                      <option value="">Selecione...</option>
                      <option>Farmácia pequena (até 80m²)</option>
                      <option>Farmácia média (80–200m²)</option>
                      <option>Farmácia grande (200m²+)</option>
                      <option>Nova abertura (sem estrutura)</option>
                      <option>Conversão de outra rede</option>
                    </select>
                  </div>
                </div>
              </Card>
              <Card accent={CZ} style={{ display:"flex", flexDirection:"column" }}>
                <SecBar color={CZ}>Como Usar</SecBar>
                <div style={{ padding:18, flex:1 }}>
                  {[
                    ["📋","Cole a transcrição completa da reunião com o lead"],
                    ["🤖","A IA identifica o perfil comportamental automaticamente"],
                    ["📊","Receba classificação em 4 níveis: interesse, experiência, qualificação RID e funil"],
                    ["🚀","Gere o Kickoff personalizado para o GS conduzir"],
                  ].map(([icon,text],i)=>(
                    <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
                      <span style={{ fontSize:17 }}>{icon}</span>
                      <span style={{ fontSize:12, color:CZ, lineHeight:1.5 }}>{text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding:"0 18px 18px" }}><Faixas n={2} opacity={.08} /></div>
              </Card>
            </div>
            <Card accent={R} style={{ marginBottom:18 }}>
              <SecBar color={R}>Transcrição da Reunião</SecBar>
              <div style={{ padding:18 }}>
                <div style={{ display:"flex", gap:10, marginBottom:10, alignItems:"center" }}>
                  <BtnInova onClick={()=>fileRef.current?.click()} outline small>📎 Upload .txt</BtnInova>
                  <span style={{ fontSize:11, color:CZ }}>ou cole diretamente no campo abaixo</span>
                  <input ref={fileRef} type="file" accept=".txt" style={{ display:"none" }} onChange={handleFile} />
                </div>
                <textarea name="transcricao" value={form.transcricao} onChange={handleField}
                  placeholder="Cole aqui a transcrição completa da reunião com o lead..."
                  rows={10} style={{ ...inp, resize:"vertical", lineHeight:1.6 }}
                />
                {form.transcricao && (
                  <div style={{ marginTop:5, fontSize:11, color:CZ, textAlign:"right" }}>
                    {form.transcricao.length.toLocaleString()} caracteres · {form.transcricao.split(/\s+/).filter(Boolean).length.toLocaleString()} palavras
                  </div>
                )}
              </div>
            </Card>
            {erro && (
              <div style={{ background:"#FEF2F2", borderLeft:`4px solid ${R}`, padding:"11px 15px", marginBottom:14, fontSize:12, color:"#991B1B" }}>
                {erro}
              </div>
            )}
            <BtnInova onClick={analisar} full>Analisar Perfil do Cliente →</BtnInova>
          </div>
        )}

        {/* ════ LOADING ═════════════════════════════════════════════════════ */}
        {step==="loading" && (
          <div style={{ background:WH, borderTop:`4px solid ${R}`, padding:"56px 40px", textAlign:"center" }}>
            <div style={{ fontSize:13, fontWeight:900, color:RD, letterSpacing:2, fontFamily:FONT, marginBottom:8 }}>ANALISANDO PERFIL</div>
            <div style={{ fontSize:12, color:CZ, marginBottom:26 }}>Processando a transcrição e identificando o perfil comportamental...</div>
            <div style={{ display:"flex", justifyContent:"center", gap:6 }}>
              {[R,RD,R].map((c,i)=>(
                <div key={i} style={{ width:10, height:10, background:c, animation:`pulse 1.2s ease-in-out ${i*.2}s infinite` }} />
              ))}
            </div>
            <style>{`@keyframes pulse{0%,80%,100%{opacity:.2;transform:scale(.7)}40%{opacity:1;transform:scale(1.2)}}`}</style>
          </div>
        )}

        {/* ════ RESULTADO ═══════════════════════════════════════════════════ */}
        {step==="result" && resultado && (
          <div>
            {/* Cabeçalho resultado */}
            <div style={{ background:WH, borderTop:`4px solid ${RD}`, marginBottom:18 }}>
              <div style={{ display:"flex" }}>
                {[RD,"#C00000",R,"#C00000",RD].map((c,i)=>(
                  <div key={i} style={{ flex:1, height:5, background:c }} />
                ))}
              </div>
              <div style={{ padding:"18px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontSize:9, color:CZ, fontWeight:900, letterSpacing:2.5, fontFamily:FONT, marginBottom:4 }}>
                    ANÁLISE CONCLUÍDA · {resultado.codigo||"—"}
                  </div>
                  <div style={{ fontSize:22, fontWeight:900, color:"#111", fontFamily:FONT, letterSpacing:1 }}>
                    {resultado.nome?.toUpperCase()||"LEAD"}
                  </div>
                  <div style={{ fontSize:11, color:CZ, marginTop:2 }}>{resultado.tamanho||"—"}</div>
                </div>
                <div style={{ background:BG, border:`2px solid ${scoreColor}`, padding:"12px 22px", textAlign:"center" }}>
                  <div style={{ fontSize:9, fontWeight:900, color:CZ, letterSpacing:2, fontFamily:FONT }}>SCORE RID</div>
                  <div style={{ fontSize:38, fontWeight:900, color:scoreColor, fontFamily:FONT, lineHeight:1.05 }}>{scoreVal}</div>
                  <div style={{ fontSize:9, color:CZ }}>/ 100</div>
                </div>
              </div>
            </div>

            {/* ABAS */}
            <div style={{ display:"flex", marginBottom:18, borderBottom:`3px solid ${R}` }}>
              {[{id:"perfil",label:"PERFIL DO CLIENTE"},{id:"onboarding",label:"KICKOFF REDE INOVA"}].map(aba=>(
                <button key={aba.id} onClick={()=>{
                  if(aba.id==="onboarding"&&!onboarding&&!loadingOnboarding) gerarOnboarding(resultado);
                  else setAbaAtiva(aba.id);
                }} style={{
                  flex:1, padding:"12px 16px", border:"none", cursor:"pointer",
                  fontFamily:FONT, fontSize:10, fontWeight:900, letterSpacing:2,
                  textTransform:"uppercase", transition:"all .15s", borderRight:"2px solid #E5E7EB",
                  background: abaAtiva===aba.id ? RD : "#D0D0D0",
                  color: abaAtiva===aba.id ? WH : CZ,
                }}>{aba.label}</button>
              ))}
            </div>

            {/* ABA PERFIL */}
            {abaAtiva==="perfil" && (
              <div>
                {/* Perfis */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
                  {[{label:"PERFIL PRINCIPAL",data:pp,key:resultado.perfil_principal},
                    {label:"PERFIL SECUNDÁRIO",data:ps,key:resultado.perfil_secundario}]
                    .map(({label,data,key})=> data && (
                    <Card key={label} accent={data.accent}>
                      <SecBar color={data.accent}>{label}</SecBar>
                      <div style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:26 }}>{data.icon}</span>
                        <div>
                          <div style={{ fontSize:14, fontWeight:900, color:data.accent, fontFamily:FONT, letterSpacing:1 }}>
                            {key.toUpperCase()}
                          </div>
                          <div style={{
                            display:"inline-block", background:data.bg, border:`1px solid ${data.border}`,
                            padding:"2px 8px", fontSize:9, fontWeight:900, color:data.accent, letterSpacing:1.5, fontFamily:FONT, marginTop:4,
                          }}>{key.toUpperCase()}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Frase chave */}
                <div style={{ background:RD, padding:"16px 20px", marginBottom:18, borderLeft:`6px solid ${R}` }}>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.55)", fontWeight:900, letterSpacing:2.5, fontFamily:FONT, marginBottom:6 }}>
                    FRASE-CHAVE DE ABORDAGEM
                  </div>
                  <div style={{ color:WH, fontSize:14, fontStyle:"italic", lineHeight:1.65 }}>"{resultado.frase_chave}"</div>
                </div>

                {/* Justificativa */}
                <Card accent={CZ} style={{ marginBottom:18 }}>
                  <SecBar color={CZ}>Justificativa do Perfil</SecBar>
                  <div style={{ padding:"12px 18px", fontSize:13, color:"#374151", lineHeight:1.7 }}>{resultado.justificativa_perfil}</div>
                </Card>

                {/* 4 níveis */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
                  {[
                    {n:"1",label:"INTERESSE",    value:resultado.nivel1_interesse,    sub:AREAS[resultado.nivel1_interesse]},
                    {n:"2",label:"EXPERIÊNCIA",  value:resultado.nivel2_experiencia,  sub:exp?.step?`Nível ${exp.step}`:""},
                    {n:"3",label:"QUALIF. RID",  value:`Score ${scoreVal}/100`,       sub:resultado.nivel3_rid?.aderencia_rede},
                    {n:"4",label:"FUNIL",        value:resultado.nivel4_funil,        sub:funil?.step?`Estágio ${funil.step}/4`:""},
                  ].map(({n,label,value,sub})=>(
                    <div key={n} style={{ background:WH, borderTop:`3px solid ${R}`, padding:13, textAlign:"center" }}>
                      <div style={{ fontSize:9, fontWeight:900, color:CZ, letterSpacing:1.5, fontFamily:FONT, marginBottom:6 }}>NÍV.{n} · {label}</div>
                      <div style={{ fontSize:12, fontWeight:900, color:RD, fontFamily:FONT, lineHeight:1.3, marginBottom:3 }}>{value}</div>
                      {sub && <div style={{ fontSize:11, color:CZ }}>{sub}</div>}
                    </div>
                  ))}
                </div>

                {/* RID detalhes */}
                <Card accent={RD} style={{ marginBottom:18 }}>
                  <SecBar>Qualificação RID — Detalhes</SecBar>
                  <div style={{ padding:16, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:8 }}>
                    {[
                      ["Pot. Investimento",resultado.nivel3_rid?.potencial_investimento],
                      ["Estrutura Equipe",resultado.nivel3_rid?.estrutura_equipe],
                      ["Estrutura Estoque",resultado.nivel3_rid?.estrutura_estoque],
                      ["Aderência à Rede",resultado.nivel3_rid?.aderencia_rede],
                    ].map(([k,v])=>(
                      <div key={k} style={{ background:BG, padding:"10px 12px", textAlign:"center" }}>
                        <div style={{ fontSize:9, color:CZ, fontWeight:900, letterSpacing:1.5, fontFamily:FONT, marginBottom:4 }}>{k.toUpperCase()}</div>
                        <div style={{ fontSize:12, fontWeight:900, color:RD, fontFamily:FONT }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding:"0 16px 16px" }}>
                    <div style={{ height:7, background:"#E5E7EB" }}>
                      <div style={{ height:7, width:`${scoreVal}%`, background:`linear-gradient(90deg,${RD},${R})`, transition:"width .8s" }} />
                    </div>
                    <div style={{ fontSize:11, color:CZ, marginTop:6 }}>{resultado.nivel3_rid?.observacao}</div>
                  </div>
                </Card>

                {/* Abordagem */}
                <Card accent={R} style={{ marginBottom:18 }}>
                  <SecBar color={R}>Abordagem Recomendada</SecBar>
                  <div style={{ padding:"12px 18px", fontSize:13, color:"#374151", lineHeight:1.8 }}>{resultado.abordagem_recomendada}</div>
                </Card>

                {/* Atenção + passos */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:22 }}>
                  <Card accent="#B45309">
                    <SecBar color="#B45309">⚠ Pontos de Atenção</SecBar>
                    <div style={{ padding:14 }}>
                      {(resultado.pontos_atencao||[]).map((p,i)=>(
                        <div key={i} style={{ display:"flex", gap:8, marginBottom:9, fontSize:12, color:"#374151", alignItems:"flex-start" }}>
                          <span style={{ color:R, fontWeight:900, marginTop:1 }}>▶</span>{p}
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card accent="#065F46">
                    <SecBar color="#065F46">✓ Próximos Passos</SecBar>
                    <div style={{ padding:14 }}>
                      {(resultado.proximos_passos||[]).map((p,i)=>(
                        <div key={i} style={{ display:"flex", gap:9, marginBottom:9, fontSize:12, color:"#374151", alignItems:"flex-start" }}>
                          <span style={{
                            minWidth:20, height:20, background:"#065F46", color:WH,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:10, fontWeight:900, fontFamily:FONT, flexShrink:0,
                          }}>{i+1}</span>{p}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
                <BtnInova onClick={reiniciar} full>← Analisar Novo Cliente</BtnInova>
              </div>
            )}

            {/* ABA KICKOFF */}
            {abaAtiva==="onboarding" && (
              <div>
                {loadingOnboarding && (
                  <div style={{ background:WH, borderTop:`4px solid ${R}`, padding:"56px 40px", textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:900, color:RD, letterSpacing:2, fontFamily:FONT, marginBottom:8 }}>MONTANDO O KICKOFF</div>
                    <div style={{ fontSize:12, color:CZ, marginBottom:26 }}>Personalizando diretrizes para o GS...</div>
                    <div style={{ display:"flex", justifyContent:"center", gap:6 }}>
                      {[R,RD,R].map((c,i)=>(
                        <div key={i} style={{ width:10, height:10, background:c, animation:`pulse 1.2s ease-in-out ${i*.2}s infinite` }} />
                      ))}
                    </div>
                    <style>{`@keyframes pulse{0%,80%,100%{opacity:.2;transform:scale(.7)}40%{opacity:1;transform:scale(1.2)}}`}</style>
                  </div>
                )}
                {erroOnboarding && (
                  <div style={{ background:"#FEF2F2", borderLeft:`4px solid ${R}`, padding:"11px 15px", fontSize:12, color:"#991B1B" }}>
                    {erroOnboarding}
                  </div>
                )}
                {onboarding && !loadingOnboarding && (
                  <div>
                    {/* Frase abertura */}
                    <div style={{ background:RD, padding:"20px 24px", marginBottom:18, borderLeft:`6px solid ${R}` }}>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.55)", fontWeight:900, letterSpacing:2.5, fontFamily:FONT, marginBottom:8 }}>
                        🎤 FRASE DE ABERTURA DO KICK-OFF
                      </div>
                      <div style={{ color:WH, fontSize:16, fontStyle:"italic", lineHeight:1.65 }}>
                        "{onboarding.frase_abertura_kickoff}"
                      </div>
                    </div>

                    {/* Como abrir + história */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
                      <Card accent={R}>
                        <SecBar color={R}>🔑 Como Abrir o Kick-off</SecBar>
                        <div style={{ padding:"12px 18px", fontSize:12, color:"#374151", lineHeight:1.7 }}>{onboarding.abertura_encantamento}</div>
                      </Card>
                      <Card accent={RD}>
                        <SecBar>📖 Como Contar a História da Rede</SecBar>
                        <div style={{ padding:"12px 18px", fontSize:12, color:"#374151", lineHeight:1.7 }}>{onboarding.historia_da_rede}</div>
                      </Card>
                    </div>

                    {/* Linguagem */}
                    <Card accent={CZ} style={{ marginBottom:18 }}>
                      <SecBar color={CZ}>🗣 Linguagem Ideal</SecBar>
                      <div style={{ padding:"12px 18px", fontSize:12, color:"#374151", lineHeight:1.7 }}>{onboarding.linguagem_ideal}</div>
                    </Card>

                    {/* Pilares */}
                    <Card accent={RD} style={{ marginBottom:18 }}>
                      <SecBar>🏗 Ordem de Prioridade dos Pilares</SecBar>
                      <div style={{ padding:16 }}>
                        {(onboarding.ordem_pilares||[]).map((p,i)=>{
                          const pc=p.prioridade==="Alta"?R:p.prioridade==="Média"?"#B45309":CZ;
                          return (
                            <div key={i} style={{ display:"flex", gap:12, marginBottom:10, background:BG, padding:11 }}>
                              <div style={{
                                minWidth:26, height:26, background:pc, color:WH,
                                display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize:11, fontWeight:900, fontFamily:FONT, flexShrink:0,
                              }}>{i+1}</div>
                              <div style={{ flex:1 }}>
                                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                                  <span style={{ fontSize:11, fontWeight:900, color:pc, fontFamily:FONT }}>{p.pilar.toUpperCase()}</span>
                                  <span style={{ fontSize:9, fontWeight:900, color:pc, border:`1px solid ${pc}`, padding:"1px 5px", fontFamily:FONT, letterSpacing:1 }}>
                                    {p.prioridade.toUpperCase()}
                                  </span>
                                </div>
                                <div style={{ fontSize:11, color:CZ, marginBottom:2 }}>{p.por_que}</div>
                                <div style={{ fontSize:11, color:"#374151", fontStyle:"italic" }}>💬 {p.como_apresentar}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Desafios + momentos */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
                      <Card accent="#B45309">
                        <SecBar color="#B45309">⚡ Desafios Antecipados</SecBar>
                        <div style={{ padding:14 }}>
                          {(onboarding.desafios_antecipados||[]).map((d,i)=>(
                            <div key={i} style={{ marginBottom:11 }}>
                              <div style={{ fontSize:11, fontWeight:900, color:"#92400E", marginBottom:3 }}>▶ {d.desafio}</div>
                              <div style={{ fontSize:11, color:"#78350F" }}>→ {d.como_contornar}</div>
                            </div>
                          ))}
                        </div>
                      </Card>
                      <Card accent="#065F46">
                        <SecBar color="#065F46">🔍 Momentos Críticos</SecBar>
                        <div style={{ padding:14, fontSize:12, color:"#374151", lineHeight:1.7 }}>{onboarding.momentos_criticos}</div>
                      </Card>
                    </div>

                    {/* Vínculo */}
                    <Card accent="#1D4ED8" style={{ marginBottom:22 }}>
                      <SecBar color="#1D4ED8">🤝 Como Manter o Vínculo</SecBar>
                      <div style={{ padding:"12px 18px", fontSize:12, color:"#374151", lineHeight:1.7 }}>{onboarding.como_manter_vinculo}</div>
                    </Card>

                    <Faixas n={3} opacity={.1} />
                    <div style={{ marginTop:18 }}>
                      <BtnInova onClick={reiniciar} full>← Analisar Novo Cliente</BtnInova>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* RODAPÉ */}
      <footer style={{ borderTop:`3px solid ${R}`, background:RD, padding:"10px 24px", marginTop:36 }}>
        <div style={{ maxWidth:900, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ color:"rgba(255,255,255,0.5)", fontSize:9, fontFamily:FONT, letterSpacing:2 }}>
            REDE INOVA DROGARIAS · SISTEMA INTERNO · GS
          </span>
          <Faixas n={3} opacity={.3} />
        </div>
      </footer>
    </div>
  );
}
