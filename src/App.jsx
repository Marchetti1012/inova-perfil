import { useState, useRef } from "react";

const INOVA_GREEN = "#CC0000";
const INOVA_DARK = "#8B0000";
const INOVA_LIGHT = "#FFF0F0";
const INOVA_ACCENT = "#FF3333";

const ANTHROPIC_KEY = const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

const PROFILES = {
  Gestor: {
    icon: "⚙️",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    desc: "Focado em processos, métricas e eficiência operacional",
  },
  Investidor: {
    icon: "📈",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    desc: "Prioriza ROI, expansão e retorno financeiro",
  },
  Operacional: {
    icon: "🏪",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    desc: "Hands-on, focado no dia a dia da loja",
  },
  "Técnico/Farmacêutico": {
    icon: "💊",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    desc: "Expertise técnica, foco em qualidade e compliance",
  },
};

const FUNIL = {
  "Lead exploratório": { color: "#6B7280", icon: "🔍", step: 1 },
  "Lead qualificado": { color: "#2563EB", icon: "✅", step: 2 },
  "Lead prioritário": { color: "#D97706", icon: "⭐", step: 3 },
  "Lead em decisão": { color: "#059669", icon: "🎯", step: 4 },
};

const AREAS = {
  Comercial: { icon: "💰", color: "#DC2626" },
  Marca: { icon: "🎨", color: "#7C3AED" },
  Gestão: { icon: "📊", color: "#2563EB" },
  Fidelização: { icon: "❤️", color: "#DB2777" },
};

const EXPERIENCIA = {
  "Empreendedor iniciante": { icon: "🌱", color: "#059669", step: 1 },
  "Dono de farmácia em operação": { icon: "🏪", color: "#D97706", step: 2 },
  "Empresário com múltiplas lojas": { icon: "🏢", color: "#7C3AED", step: 3 },
};

export default function InovaPerfilCliente() {
  const [step, setStep] = useState("form"); // form | loading | result
  const [form, setForm] = useState({
    nome: "",
    codigo: "",
    tamanho: "",
    transcricao: "",
  });
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const fileRef = useRef();

  function handleField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "docx" || ext === "pdf") {
      setErro("⚠️ Para arquivos .docx ou .pdf: abra o arquivo, selecione tudo (Ctrl+A), copie (Ctrl+C) e cole no campo de texto abaixo.");
      return;
    }
    const text = await file.text();
    setErro("");
    setForm({ ...form, transcricao: text });
  }

  async function analisar() {
    if (!form.transcricao.trim()) {
      setErro("Cole ou faça upload da transcrição da reunião.");
      return;
    }
    setErro("");
    setStep("loading");

    const prompt = `Você é um especialista em análise de perfil de franqueados para a Rede Inova Drogarias.

Analise a transcrição abaixo e retorne um JSON com a classificação completa do lead. Responda APENAS com JSON válido, sem texto extra, sem markdown.

Dados do lead:
- Nome: ${form.nome || "Não informado"}
- Código da loja: ${form.codigo || "Não informado"}
- Tamanho da farmácia: ${form.tamanho || "Não informado"}

Transcrição da reunião:
${form.transcricao}

Retorne exatamente neste formato JSON:
{
  "perfil_principal": "<um de: Gestor | Investidor | Operacional | Técnico/Farmacêutico>",
  "perfil_secundario": "<um de: Gestor | Investidor | Operacional | Técnico/Farmacêutico>",
  "justificativa_perfil": "<2-3 frases explicando por que esses perfis foram identificados>",
  "nivel1_interesse": "<um de: Comercial | Marca | Gestão | Fidelização>",
  "nivel1_justificativa": "<1 frase>",
  "nivel2_experiencia": "<um de: Empreendedor iniciante | Dono de farmácia em operação | Empresário com múltiplas lojas>",
  "nivel2_justificativa": "<1 frase>",
  "nivel3_rid": {
    "potencial_investimento": "<Alto | Médio | Baixo>",
    "estrutura_equipe": "<Forte | Adequada | Precisa desenvolver>",
    "estrutura_estoque": "<Bem estruturado | Médio | Precisa desenvolver>",
    "aderencia_rede": "<Alta | Média | Baixa>",
    "score_geral": "<número de 0 a 100>",
    "observacao": "<1-2 frases>"
  },
  "nivel4_funil": "<um de: Lead exploratório | Lead qualificado | Lead prioritário | Lead em decisão>",
  "nivel4_justificativa": "<1 frase>",
  "abordagem_recomendada": "<3-5 frases sobre como se comunicar com esse cliente, a linguagem e tom adequados>",
  "pontos_atencao": ["<ponto 1>", "<ponto 2>", "<ponto 3>"],
  "proximos_passos": ["<passo 1>", "<passo 2>", "<passo 3>"],
  "frase_chave": "<Uma frase curta que resume como falar com esse cliente>"
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "Erro da API Anthropic");
      const raw = data.content?.map((b) => b.text || "").join("") || "";
      if (!raw) throw new Error("Resposta vazia da API");
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResultado({ ...parsed, nome: form.nome, codigo: form.codigo, tamanho: form.tamanho });
      setStep("result");
    } catch (e) {
      const msg = e?.message || String(e);
      setErro("Erro ao processar a análise: " + msg + " — Verifique se a chave de API está correta.");
      setStep("form");
    }
  }

  function reiniciar() {
    setStep("form");
    setResultado(null);
    setForm({ nome: "", codigo: "", tamanho: "", transcricao: "" });
  }

  const pp = resultado && PROFILES[resultado.perfil_principal];
  const ps = resultado && PROFILES[resultado.perfil_secundario];
  const funil = resultado && FUNIL[resultado.nivel4_funil];
  const area = resultado && AREAS[resultado.nivel1_interesse];
  const exp = resultado && EXPERIENCIA[resultado.nivel2_experiencia];

  return (
    <div style={{ minHeight: "100vh", background: "#F0F7F4", fontFamily: "'Georgia', serif" }}>
      {/* HEADER */}
      <div style={{
        background: `linear-gradient(135deg, ${INOVA_DARK} 0%, ${INOVA_GREEN} 100%)`,
        padding: "28px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 24px rgba(0,85,58,0.25)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, border: "2px solid rgba(255,255,255,0.3)"
          }}>💊</div>
          <div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: "bold", letterSpacing: 0.5 }}>
              Inova Drogarias
            </div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontStyle: "italic" }}>
              Sistema de Identificação de Perfil do Cliente
            </div>
          </div>
        </div>
        {step === "result" && (
          <button onClick={reiniciar} style={{
            background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)",
            color: "#fff", padding: "8px 20px", borderRadius: 8, cursor: "pointer",
            fontSize: 13, fontFamily: "inherit"
          }}>
            ← Nova Análise
          </button>
        )}
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 20px" }}>

        {/* FORMULÁRIO */}
        {step === "form" && (
          <div>
            <div style={{
              background: "#fff", borderRadius: 16, padding: 32,
              boxShadow: "0 2px 16px rgba(0,85,58,0.08)", marginBottom: 24,
              border: `1px solid ${INOVA_LIGHT}`
            }}>
              <h2 style={{ margin: "0 0 6px", color: INOVA_DARK, fontSize: 20 }}>
                Dados do Lead
              </h2>
              <p style={{ margin: "0 0 24px", color: "#6B7280", fontSize: 14 }}>
                Preencha as informações básicas antes de carregar a transcrição.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 6, fontWeight: "600" }}>
                    Nome do cliente
                  </label>
                  <input
                    name="nome" value={form.nome} onChange={handleField}
                    placeholder="Ex: João Silva"
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8,
                      border: "1.5px solid #FECACA", fontSize: 14, fontFamily: "inherit",
                      outline: "none", boxSizing: "border-box",
                      background: "#FFFAFA"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 6, fontWeight: "600" }}>
                    Código da loja
                  </label>
                  <input
                    name="codigo" value={form.codigo} onChange={handleField}
                    placeholder="Ex: RID-0042"
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8,
                      border: "1.5px solid #FECACA", fontSize: 14, fontFamily: "inherit",
                      outline: "none", boxSizing: "border-box",
                      background: "#FFFAFA"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 6, fontWeight: "600" }}>
                  Tamanho / situação da farmácia
                </label>
                <select
                  name="tamanho" value={form.tamanho} onChange={handleField}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8,
                    border: "1.5px solid #FECACA", fontSize: 14, fontFamily: "inherit",
                    outline: "none", background: "#FFFAFA", color: form.tamanho ? "#111" : "#9CA3AF"
                  }}
                >
                  <option value="">Selecione uma opção</option>
                  <option value="Ainda não abriu / abrindo primeira farmácia">Ainda não abriu / abrindo primeira farmácia</option>
                  <option value="1 farmácia em operação (pequeno porte)">1 farmácia em operação (pequeno porte)</option>
                  <option value="1 farmácia em operação (médio porte)">1 farmácia em operação (médio porte)</option>
                  <option value="1 farmácia em operação (grande porte)">1 farmácia em operação (grande porte)</option>
                  <option value="2 a 5 farmácias">2 a 5 farmácias</option>
                  <option value="Mais de 5 farmácias">Mais de 5 farmácias</option>
                </select>
              </div>
            </div>

            <div style={{
              background: "#fff", borderRadius: 16, padding: 32,
              boxShadow: "0 2px 16px rgba(0,85,58,0.08)",
              border: `1px solid ${INOVA_LIGHT}`
            }}>
              <h2 style={{ margin: "0 0 6px", color: INOVA_DARK, fontSize: 20 }}>
                Transcrição da Reunião
              </h2>
              <p style={{ margin: "0 0 20px", color: "#6B7280", fontSize: 14 }}>
                Cole o texto ou faça upload de um arquivo (.txt, .pdf, .docx).
              </p>

              {/* Upload área */}
              <div
                onClick={() => fileRef.current.click()}
                style={{
                  border: `2px dashed ${INOVA_GREEN}`, borderRadius: 12,
                  padding: "20px", marginBottom: 16, cursor: "pointer",
                  background: INOVA_LIGHT, textAlign: "center",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>📎</div>
                <div style={{ color: INOVA_GREEN, fontWeight: "600", fontSize: 14 }}>
                  Clique para fazer upload
                </div>
                <div style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>
                  Apenas .txt — ou cole o texto abaixo
                </div>
                <input ref={fileRef} type="file" accept=".txt" onChange={handleFile}
                  style={{ display: "none" }} />
              </div>

              <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, marginBottom: 12 }}>
                — ou cole a transcrição abaixo —
              </div>

              <textarea
                name="transcricao" value={form.transcricao} onChange={handleField}
                placeholder="Cole aqui a transcrição completa da reunião com o lead..."
                rows={10}
                style={{
                  width: "100%", padding: "14px", borderRadius: 10,
                  border: "1.5px solid #FECACA", fontSize: 13, fontFamily: "inherit",
                  outline: "none", resize: "vertical", boxSizing: "border-box",
                  background: "#FFFAFA", lineHeight: 1.6, color: "#374151"
                }}
              />

              {form.transcricao && (
                <div style={{
                  marginTop: 8, fontSize: 12, color: INOVA_GREEN,
                  textAlign: "right"
                }}>
                  ✓ {form.transcricao.length.toLocaleString()} caracteres carregados
                </div>
              )}

              {erro && (
                <div style={{
                  marginTop: 12, padding: "10px 16px", borderRadius: 8,
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  color: "#DC2626", fontSize: 13
                }}>
                  ⚠️ {erro}
                </div>
              )}

              <button
                onClick={analisar}
                style={{
                  marginTop: 20, width: "100%", padding: "14px",
                  background: `linear-gradient(135deg, ${INOVA_GREEN}, ${INOVA_DARK})`,
                  color: "#fff", border: "none", borderRadius: 10, fontSize: 16,
                  fontWeight: "bold", cursor: "pointer", fontFamily: "inherit",
                  letterSpacing: 0.5, boxShadow: `0 4px 16px rgba(0,133,90,0.3)`
                }}
              >
                🔍 Analisar Perfil do Cliente
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div style={{
            background: "#fff", borderRadius: 20, padding: "60px 40px",
            textAlign: "center", boxShadow: "0 2px 24px rgba(0,85,58,0.1)"
          }}>
            <div style={{ fontSize: 48, marginBottom: 20, animation: "spin 2s linear infinite" }}>
              🔬
            </div>
            <h3 style={{ color: INOVA_DARK, margin: "0 0 10px", fontSize: 22 }}>
              Analisando perfil...
            </h3>
            <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
              Processando a transcrição e identificando padrões de comportamento.
            </p>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: INOVA_GREEN,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
            <style>{`
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              @keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.2); } }
            `}</style>
          </div>
        )}

        {/* RESULTADO */}
        {step === "result" && resultado && (
          <div>

            {/* CABEÇALHO DO CLIENTE */}
            <div style={{
              background: `linear-gradient(135deg, ${INOVA_DARK} 0%, ${INOVA_GREEN} 100%)`,
              borderRadius: 16, padding: "24px 28px", marginBottom: 20,
              color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: 12
            }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>
                  {resultado.nome || "Lead"}
                </div>
                <div style={{ opacity: 0.8, fontSize: 14 }}>
                  {resultado.codigo && `🏷️ ${resultado.codigo}`}
                  {resultado.codigo && resultado.tamanho && " · "}
                  {resultado.tamanho && `🏪 ${resultado.tamanho}`}
                </div>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.15)", borderRadius: 10,
                padding: "10px 18px", border: "1.5px solid rgba(255,255,255,0.3)",
                textAlign: "center"
              }}>
                <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 2, textTransform: "uppercase", letterSpacing: 1 }}>
                  Score RID
                </div>
                <div style={{ fontSize: 28, fontWeight: "bold" }}>
                  {resultado.nivel3_rid?.score_geral ?? "—"}
                  <span style={{ fontSize: 14, opacity: 0.7 }}>/100</span>
                </div>
              </div>
            </div>

            {/* FRASE CHAVE */}
            <div style={{
              background: "#FFFBEB", border: "1.5px solid #FDE68A",
              borderRadius: 12, padding: "16px 20px", marginBottom: 20,
              display: "flex", gap: 12, alignItems: "flex-start"
            }}>
              <span style={{ fontSize: 20 }}>💬</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: "700", color: "#92400E", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                  Frase-chave para abordagem
                </div>
                <div style={{ color: "#78350F", fontSize: 15, fontStyle: "italic" }}>
                  "{resultado.frase_chave}"
                </div>
              </div>
            </div>

            {/* PERFIS PRINCIPAL + SECUNDÁRIO */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                { label: "Perfil Principal", key: "perfil_principal", badge: "★" },
                { label: "Perfil Secundário", key: "perfil_secundario", badge: "◇" },
              ].map(({ label, key, badge }) => {
                const prof = PROFILES[resultado[key]];
                if (!prof) return null;
                return (
                  <div key={key} style={{
                    background: prof.bg, border: `2px solid ${prof.border}`,
                    borderRadius: 14, padding: "20px"
                  }}>
                    <div style={{ fontSize: 11, fontWeight: "700", color: prof.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                      {badge} {label}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 28 }}>{prof.icon}</span>
                      <span style={{ fontSize: 18, fontWeight: "bold", color: prof.color }}>
                        {resultado[key]}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{prof.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* JUSTIFICATIVA DOS PERFIS */}
            <div style={{
              background: "#fff", borderRadius: 12, padding: "18px 22px",
              border: "1px solid #E5E7EB", marginBottom: 20,
              borderLeft: `4px solid ${INOVA_GREEN}`
            }}>
              <div style={{ fontSize: 12, fontWeight: "700", color: INOVA_GREEN, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Justificativa da Classificação
              </div>
              <p style={{ margin: 0, color: "#374151", fontSize: 14, lineHeight: 1.7 }}>
                {resultado.justificativa_perfil}
              </p>
            </div>

            {/* 4 NÍVEIS */}
            <div style={{
              background: "#fff", borderRadius: 14, padding: "22px 24px",
              border: "1px solid #E5E7EB", marginBottom: 20
            }}>
              <h3 style={{ margin: "0 0 18px", color: INOVA_DARK, fontSize: 16 }}>
                📊 Classificação por Níveis
              </h3>

              {/* Nível 1 */}
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Nível 1 — Interesse Principal
                  </div>
                  {area && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "#F9FAFB", border: "1.5px solid #E5E7EB",
                      borderRadius: 20, padding: "4px 14px",
                      fontSize: 14, fontWeight: "700", color: area.color
                    }}>
                      {area.icon} {resultado.nivel1_interesse}
                    </div>
                  )}
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6B7280" }}>
                  {resultado.nivel1_justificativa}
                </p>
              </div>

              {/* Nível 2 */}
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Nível 2 — Experiência
                  </div>
                  {exp && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "#F9FAFB", border: "1.5px solid #E5E7EB",
                      borderRadius: 20, padding: "4px 14px",
                      fontSize: 13, fontWeight: "700", color: exp.color
                    }}>
                      {exp.icon} {resultado.nivel2_experiencia}
                    </div>
                  )}
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6B7280" }}>
                  {resultado.nivel2_justificativa}
                </p>
              </div>

              {/* Nível 3 - RID */}
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                  Nível 3 — Qualificação RID
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Potencial de Investimento", val: resultado.nivel3_rid?.potencial_investimento },
                    { label: "Estrutura de Equipe", val: resultado.nivel3_rid?.estrutura_equipe },
                    { label: "Estrutura de Estoque", val: resultado.nivel3_rid?.estrutura_estoque },
                    { label: "Aderência à Rede", val: resultado.nivel3_rid?.aderencia_rede },
                  ].map(({ label, val }) => {
                    const isHigh = ["Alto", "Forte", "Bem estruturado", "Alta"].includes(val);
                    const isMed = ["Médio", "Adequada", "Média"].includes(val);
                    const color = isHigh ? "#059669" : isMed ? "#D97706" : "#DC2626";
                    const bg = isHigh ? "#ECFDF5" : isMed ? "#FFFBEB" : "#FEF2F2";
                    return (
                      <div key={label} style={{ background: bg, borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: "700", color }}>{val}</div>
                      </div>
                    );
                  })}
                </div>
                {resultado.nivel3_rid?.observacao && (
                  <p style={{ margin: "10px 0 0", fontSize: 12, color: "#6B7280", fontStyle: "italic" }}>
                    {resultado.nivel3_rid.observacao}
                  </p>
                )}
              </div>

              {/* Nível 4 - Funil */}
              <div>
                <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                  Nível 4 — Estágio no Funil
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                  {Object.entries(FUNIL).map(([name, data]) => {
                    const isActive = resultado.nivel4_funil === name;
                    return (
                      <div key={name} style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 12,
                        fontWeight: isActive ? "700" : "400",
                        background: isActive ? data.color : "#F3F4F6",
                        color: isActive ? "#fff" : "#9CA3AF",
                        border: `2px solid ${isActive ? data.color : "transparent"}`,
                        transition: "all 0.2s"
                      }}>
                        {data.icon} {name}
                      </div>
                    );
                  })}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
                  {resultado.nivel4_justificativa}
                </p>
              </div>
            </div>

            {/* ABORDAGEM RECOMENDADA */}
            <div style={{
              background: "#F0FDF4", border: "1.5px solid #BBF7D0",
              borderRadius: 14, padding: "20px 24px", marginBottom: 20
            }}>
              <h3 style={{ margin: "0 0 12px", color: INOVA_DARK, fontSize: 15 }}>
                🎯 Abordagem Recomendada
              </h3>
              <p style={{ margin: 0, color: "#166534", fontSize: 14, lineHeight: 1.8 }}>
                {resultado.abordagem_recomendada}
              </p>
            </div>

            {/* PONTOS DE ATENÇÃO + PRÓXIMOS PASSOS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div style={{
                background: "#FFF7ED", border: "1.5px solid #FED7AA",
                borderRadius: 14, padding: "20px 22px"
              }}>
                <h3 style={{ margin: "0 0 12px", color: "#92400E", fontSize: 15 }}>
                  ⚠️ Pontos de Atenção
                </h3>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {(resultado.pontos_atencao || []).map((p, i) => (
                    <li key={i} style={{
                      display: "flex", gap: 8, alignItems: "flex-start",
                      marginBottom: 8, fontSize: 13, color: "#78350F"
                    }}>
                      <span style={{ color: "#F97316", marginTop: 1 }}>◆</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{
                background: "#EFF6FF", border: "1.5px solid #BFDBFE",
                borderRadius: 14, padding: "20px 22px"
              }}>
                <h3 style={{ margin: "0 0 12px", color: "#1E40AF", fontSize: 15 }}>
                  ✅ Próximos Passos
                </h3>
                <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {(resultado.proximos_passos || []).map((p, i) => (
                    <li key={i} style={{
                      display: "flex", gap: 10, alignItems: "flex-start",
                      marginBottom: 8, fontSize: 13, color: "#1D4ED8"
                    }}>
                      <span style={{
                        minWidth: 20, height: 20, borderRadius: "50%",
                        background: "#2563EB", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: "bold"
                      }}>{i + 1}</span>
                      {p}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <button
              onClick={reiniciar}
              style={{
                width: "100%", padding: "14px",
                background: `linear-gradient(135deg, ${INOVA_GREEN}, ${INOVA_DARK})`,
                color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
                fontWeight: "bold", cursor: "pointer", fontFamily: "inherit"
              }}
            >
              ← Analisar Novo Cliente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
