// wf-screens-1.jsx — Login, Dashboard, Tâches, Commissions

const { C, T, WFBox, WFCard, WFKpi, WFBadge, WFBtn, WFProg, WFRow, WFSep,
  WFAvatar, WFTag, WFNote, WFStep, Shell, SectionHd } = window;

// ═══════════════════════════════════════════════════════════════
// CONNEXION / 2FA
// ═══════════════════════════════════════════════════════════════

const LoginA = () => (
  <div style={{ display:'flex', height:'100%', fontFamily:"'DM Sans',sans-serif" }}>
    {/* Left — Brand panel */}
    <div style={{ width:'45%', background:C.slateDark, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:24, padding:48, position:'relative' }}>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:8 }}>
        <div style={{ width:48,height:48,borderRadius:8,background:C.green,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <T s={16} c='#fff' w={700}>SFE</T>
        </div>
        <div>
          <T s={16} c='#fff' w={700}>Mairie de</T>
          <T s={13} c='rgba(255,255,255,0.6)'>Saint-Jean-de-Muzols</T>
        </div>
      </div>
      <WFBox width='100%' h={220} label='Illustration / photo commune' style={{ borderRadius:12, opacity:0.4 }} />
      <T s={13} c='rgba(255,255,255,0.5)' style={{ textAlign:'center' }}>
        Espace Numérique de Travail — réservé aux élus et agents municipaux
      </T>
      <WFNote style={{ position:'absolute', bottom:24, right:24 }}>Fond : photo Ardèche</WFNote>
    </div>
    {/* Right — Form */}
    <div style={{ flex:1, background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:380 }}>
        <T s={22} c={C.fg} w={700} mb={4}>Connexion</T>
        <T s={13} c={C.subtle} mb={28}>Veuillez vous identifier pour accéder à l'ENT.</T>
        <T s={11} c={C.muted} w={600} mb={6}>Adresse e-mail</T>
        <WFBox width='100%' h={40} color={C.white} label='jean.martin@mairie-sjm.fr'
          style={{ border:`1px solid ${C.border}`, borderRadius:6, marginBottom:12 }} />
        <T s={11} c={C.muted} w={600} mb={6}>Mot de passe</T>
        <WFBox width='100%' h={40} color={C.white} label='••••••••••'
          style={{ border:`1px solid ${C.border}`, borderRadius:6, marginBottom:20 }} />
        <WFBtn label='Se connecter' primary style={{ width:'100%', justifyContent:'center', marginBottom:20 }} />
        <WFSep my={16} />
        <div style={{ background:C.infoLight, border:`1px solid ${C.info}30`, borderRadius:8, padding:14 }}>
          <T s={11} c={C.info} w={600} mb={6}>Vérification en deux étapes</T>
          <T s={11} c={C.muted} mb={10}>Saisissez le code reçu par SMS ou application d'authentification.</T>
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            {[1,2,3,4,5,6].map(i => (
              <WFBox key={i} width={40} h={44} color={C.white} label={i===1?'·':''} round={6}
                style={{ border:`1px solid ${i===1?C.green:C.border}`, flex:1 }} />
            ))}
          </div>
          <WFBtn label='Valider le code' primary small />
        </div>
      </div>
    </div>
  </div>
);

const LoginB = () => (
  <div style={{ height:'100%', background:C.bg, display:'flex', alignItems:'center',
    justifyContent:'center', fontFamily:"'DM Sans',sans-serif" }}>
    <div style={{ width:420, background:C.white, borderRadius:16, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', overflow:'hidden' }}>
      {/* Header band */}
      <div style={{ background:C.slateDark, padding:'28px 32px 24px', textAlign:'center' }}>
        <div style={{ width:52,height:52,borderRadius:10,background:C.green,margin:'0 auto 12px',
          display:'flex',alignItems:'center',justifyContent:'center' }}>
          <T s={18} c='#fff' w={700}>SFE</T>
        </div>
        <T s={15} c='#fff' w={600}>Espace Numérique de Travail</T>
        <T s={11} c='rgba(255,255,255,0.5)'>Mairie de Saint-Jean-de-Muzols</T>
      </div>
      {/* Étape 1 */}
      <div style={{ padding:'24px 32px' }}>
        <WFStep steps={['Identifiants','Code 2FA','Accès']} current={1} />
        <T s={13} c={C.muted} mb={16}>Code de vérification envoyé au ••• ••• 42</T>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {[1,2,3,4,5,6].map(i => (
            <WFBox key={i} width={44} h={52} color={C.bg} round={8}
              style={{ border:`2px solid ${i<=3?C.green:C.border}`, flex:1 }} />
          ))}
        </div>
        <WFBtn label='Valider' primary style={{ width:'100%', justifyContent:'center', marginBottom:10 }} />
        <WFBtn label='Renvoyer le code' style={{ width:'100%', justifyContent:'center' }} />
        <WFNote style={{ marginTop:12 }}>Expire dans 4:32</WFNote>
      </div>
    </div>
  </div>
);

const LoginC = () => (
  <div style={{ height:'100%', display:'flex', fontFamily:"'DM Sans',sans-serif", position:'relative' }}>
    <WFBox width='100%' h='100%' label='Fond : paysage Eyrieux / commune'
      style={{ position:'absolute', inset:0, borderRadius:0, background:'#c5cfc5' }} />
    <div style={{ position:'absolute', inset:0, background:'rgba(45,59,45,0.55)' }} />
    {/* Glass card */}
    <div style={{ position:'relative', margin:'auto', width:400,
      background:'rgba(255,255,255,0.92)', backdropFilter:'blur(12px)',
      borderRadius:20, boxShadow:'0 16px 48px rgba(0,0,0,0.25)', padding:'32px 36px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
        <div style={{ width:40,height:40,borderRadius:8,background:C.green,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <T s={13} c='#fff' w={700}>SFE</T>
        </div>
        <div>
          <T s={14} c={C.fg} w={700}>Connexion</T>
          <T s={10} c={C.subtle}>Saint-Jean-de-Muzols</T>
        </div>
      </div>
      <T s={11} c={C.muted} w={600} mb={5}>E-mail</T>
      <WFBox width='100%' h={38} color='rgba(244,246,241,0.8)' label='adresse@mairie.fr'
        style={{ border:`1px solid ${C.border}`, borderRadius:8, marginBottom:10 }} />
      <T s={11} c={C.muted} w={600} mb={5}>Mot de passe</T>
      <WFBox width='100%' h={38} color='rgba(244,246,241,0.8)' label='••••••••'
        style={{ border:`1px solid ${C.border}`, borderRadius:8, marginBottom:16 }} />
      <WFBtn label='Continuer' primary style={{ width:'100%', justifyContent:'center', marginBottom:12 }} />
      <div style={{ textAlign:'center' }}>
        <T s={11} c={C.subtle}>Connexion avec certificat numérique</T>
      </div>
      <WFSep my={14} />
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ width:8,height:8,borderRadius:'50%',background:C.success }} />
        <T s={10} c={C.subtle}>Connexion sécurisée — hébergement souverain France</T>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// TABLEAU DE BORD
// ═══════════════════════════════════════════════════════════════

const DashA = () => (
  <Shell title="Tableau de bord" active={0} notif={3}>
    {/* KPI row */}
    <div style={{ display:'flex', gap:12, marginBottom:16 }}>
      <WFKpi label="Mes tâches en cours" value="12" sub="dont 3 urgentes" />
      <WFKpi label="Factures en attente" value="3" sub="à valider" color={C.warning} />
      <WFKpi label="Prochaine réunion" value="5 mai" sub="Commission Travaux" color={C.slate} />
      <WFKpi label="Notifications" value="2" sub="non lues" color={C.terra} />
    </div>
    {/* Main area */}
    <div style={{ display:'flex', gap:12 }}>
      {/* Tasks */}
      <WFCard style={{ flex:2 }} p={16}>
        <SectionHd title="Mes tâches urgentes"
          actions={<><WFBadge label="Voir toutes" type="default" /><WFBtn label="+ Ajouter" small /></>} />
        <WFRow label="Répondre à la demande PLU — secteur Nord" sub="Commission Travaux · Échéance : 2 mai" badge="Urgent" badgeType="danger" right="Moi" dot={C.danger} />
        <WFRow label="Valider devis éclairage public" sub="Finances · Échéance : 5 mai" badge="En cours" badgeType="warning" right="Moi" dot={C.warning} />
        <WFRow label="Préparer ordre du jour — Conseil" sub="Admin Générale · Échéance : 8 mai" badge="À faire" badgeType="default" right="Moi" dot={C.subtle} />
        <WFRow label="Signer la convention avec CC Pays de Vernoux" sub="Partenariat · Échéance : 10 mai" badge="À faire" badgeType="default" right="Moi" dot={C.subtle} last />
      </WFCard>
      {/* Right column */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
        <WFCard p={14}>
          <SectionHd title="Agenda — Mai 2026" />
          <WFBox width='100%' h={110} label='Mini calendrier' style={{ borderRadius:6, marginBottom:10 }} />
          <WFRow label="5 mai — Réunion Commission Travaux" sub="14h00 · Salle du Conseil" dot={C.green} />
          <WFRow label="8 mai — Conseil Municipal" sub="19h00 · Mairie" dot={C.slate} />
          <WFRow label="12 mai — Point budget S1" sub="10h00 · Visioconférence" dot={C.terra} last />
        </WFCard>
        <WFCard p={14}>
          <SectionHd title="Activité récente" />
          <WFRow label="Marie D. a créé 3 tâches" sub="Suite CR Commission Urbanisme" right="10h42" />
          <WFRow label="Facture EDF soumise" sub="Validation en attente" right="09:15" />
          <WFRow label="Nouvelle délibération publiée" sub="Délib. 2026-014" right="Hier" last />
        </WFCard>
      </div>
    </div>
  </Shell>
);

const DashB = () => (
  <Shell title="Tableau de bord" active={0} notif={3}>
    {/* Greeting */}
    <div style={{ marginBottom:20 }}>
      <T s={22} c={C.fg} w={700} mb={2}>Bonjour, Jean — mercredi 30 avril</T>
      <T s={13} c={C.subtle}>Vous avez 4 tâches à traiter aujourd'hui et une réunion à 14h.</T>
    </div>
    <div style={{ display:'flex', gap:16 }}>
      {/* Today tasks — big focus */}
      <div style={{ flex:2, display:'flex', flexDirection:'column', gap:12 }}>
        <WFCard p={16}>
          <SectionHd title="À faire aujourd'hui" actions={<WFBadge label="4 tâches" type="primary" />} />
          {[
            { label:'Valider devis éclairage public', done:true, tag:'Finances' },
            { label:'Répondre demande PLU — secteur Nord', done:false, tag:'Travaux' },
            { label:'Préparer OJ Conseil du 8 mai', done:false, tag:'Admin' },
            { label:'Signer convention CC Pays de Vernoux', done:false, tag:'Partenariat' },
          ].map((t,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0',
              borderBottom: i<3?`1px solid ${C.border}`:'none', opacity:t.done?0.5:1 }}>
              <div style={{ width:18,height:18,borderRadius:4,border:`2px solid ${t.done?C.success:C.border}`,
                background:t.done?C.success:'transparent', flexShrink:0, display:'flex',alignItems:'center',justifyContent:'center' }}>
                {t.done && <T s={10} c='#fff' w={700}>✓</T>}
              </div>
              <T s={13} c={t.done?C.subtle:C.fg} w={t.done?400:500} style={{ flex:1, textDecoration:t.done?'line-through':'none' }}>{t.label}</T>
              <WFTag label={t.tag} />
            </div>
          ))}
        </WFCard>
        <WFCard p={16}>
          <SectionHd title="Cette semaine" />
          <WFRow label="5 mai — Réunion Commission Travaux" sub="14h · Salle du Conseil" badge="Réunion" badgeType="info" dot={C.info} />
          <WFRow label="Délibération PLU à soumettre avant le 7 mai" sub="Documents à préparer" badge="Urgent" badgeType="danger" dot={C.danger} />
          <WFRow label="8 mai — Conseil Municipal" sub="19h · Mairie" badge="Réunion" badgeType="info" dot={C.info} last />
        </WFCard>
      </div>
      {/* Right: notifications + quick actions */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
        <WFCard p={14}>
          <SectionHd title="Notifications" />
          {[
            { text:'CR Commission Urbanisme uploadé', sub:'3 tâches extraites par l\'IA', type:'primary' },
            { text:'Facture EDF en attente de validation', sub:'Montant : 1 240 €', type:'warning' },
            { text:'Marie D. vous a assigné une tâche', sub:'il y a 15 min', type:'default' },
          ].map((n,i) => (
            <div key={i} style={{ display:'flex',gap:8,padding:'8px 0',borderBottom:i<2?`1px solid ${C.border}`:'none' }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:n.type==='primary'?C.green:n.type==='warning'?C.warning:C.subtle,marginTop:4,flexShrink:0 }} />
              <div><T s={12} c={C.fg} w={500}>{n.text}</T><T s={10} c={C.subtle}>{n.sub}</T></div>
            </div>
          ))}
        </WFCard>
        <WFCard p={14}>
          <SectionHd title="Actions rapides" />
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <WFBtn label="+ Créer une tâche" style={{ width:'100%', justifyContent:'center' }} />
            <WFBtn label="Uploader un compte rendu" style={{ width:'100%', justifyContent:'center' }} />
            <WFBtn label="Soumettre une facture" style={{ width:'100%', justifyContent:'center' }} />
          </div>
        </WFCard>
        <WFNote>Connexion rapide aux workflows les plus fréquents</WFNote>
      </div>
    </div>
  </Shell>
);

const DashC = () => (
  <Shell title="Tableau de bord — Vue pilotage" active={0} notif={3}>
    {/* Alert banner */}
    <div style={{ background:C.warningLight, border:`1px solid ${C.warning}40`, borderRadius:8,
      padding:'10px 16px', display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
      <div style={{ width:8,height:8,borderRadius:'50%',background:C.warning,flexShrink:0 }} />
      <T s={13} c={C.warning} w={600} style={{ flex:1 }}>3 factures en attente de validation — dont 1 depuis plus de 5 jours</T>
      <WFBtn label="Traiter" small style={{ borderColor:C.warning, color:C.warning }} />
    </div>
    {/* KPIs */}
    <div style={{ display:'flex', gap:12, marginBottom:16 }}>
      <WFKpi label="Tâches actives (total équipe)" value="34" sub="12 en retard" />
      <WFKpi label="Budget consommé 2026" value="42%" sub="sur 380 000 €" color={C.slate} />
      <WFKpi label="Agents en congé cette semaine" value="1" sub="sur 7" color={C.terra} />
    </div>
    {/* Bottom: Finance + Commissions */}
    <div style={{ display:'flex', gap:12 }}>
      <WFCard style={{ flex:3 }} p={16}>
        <SectionHd title="Suivi budgétaire par poste" actions={<WFBtn label="Rapport complet" small />} />
        {[
          { label:'Voirie & travaux publics', pct:72, budget:'95 000 €' },
          { label:'Personnel & charges sociales', pct:46, budget:'120 000 €' },
          { label:'Fonctionnement général', pct:38, budget:'60 000 €' },
          { label:'Enfance & jeunesse', pct:89, budget:'42 000 €' },
          { label:'Culture & animations', pct:24, budget:'18 000 €' },
        ].map((b,i) => (
          <div key={i} style={{ marginBottom:12 }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
              <T s={12} c={C.fg} w={500}>{b.label}</T>
              <T s={11} c={b.pct>80?C.danger:b.pct>60?C.warning:C.success} w={600}>{b.pct}% — {b.budget}</T>
            </div>
            <WFProg pct={b.pct} />
          </div>
        ))}
      </WFCard>
      <div style={{ flex:2, display:'flex', flexDirection:'column', gap:12 }}>
        <WFCard p={14}>
          <SectionHd title="État des commissions" />
          {[
            { label:'Admin & Finance', tasks:8, next:'5 mai', ok:true },
            { label:'Développement', tasks:5, next:'12 mai', ok:true },
            { label:'Enfance & Jeunesse', tasks:3, next:'19 mai', ok:true },
            { label:'Animation', tasks:1, next:'26 mai', ok:true },
            { label:'Travaux & Urbanisme', tasks:12, next:'5 mai', ok:false },
          ].map((c,i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:8,padding:'6px 0',
              borderBottom:i<4?`1px solid ${C.border}`:'none' }}>
              <div style={{ width:8,height:8,borderRadius:'50%',background:c.ok?C.success:C.danger,flexShrink:0 }} />
              <T s={12} c={C.fg} style={{ flex:1 }}>{c.label}</T>
              <T s={10} c={C.subtle}>{c.tasks} tâches</T>
              <WFBadge label={c.next} type={c.ok?'default':'warning'} />
            </div>
          ))}
        </WFCard>
        <WFCard p={14}>
          <SectionHd title="Charge par élu" />
          {[['Jean M.', 12],['Marie D.',9],['Laurent F.',7],['Pierre R.',6]].map(([n,v],i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
              <WFAvatar initials={n.split(' ').map(x=>x[0]).join('')} size={22} color={[C.slate,C.green,C.terra,C.info][i]} />
              <T s={11} c={C.fg} style={{ flex:1 }}>{n}</T>
              <T s={11} c={C.subtle} w={600}>{v} tâches</T>
            </div>
          ))}
        </WFCard>
      </div>
    </div>
  </Shell>
);

// ═══════════════════════════════════════════════════════════════
// MODULE TÂCHES
// ═══════════════════════════════════════════════════════════════

const TasksA = () => (
  <Shell title="Mes tâches" active={1}>
    {/* Filters */}
    <div style={{ display:'flex', gap:8, marginBottom:16 }}>
      {['Toutes (34)','Mes tâches (12)','En attente (5)','Terminées (17)'].map((f,i) => (
        <div key={i} style={{ padding:'6px 14px', borderRadius:20, cursor:'pointer',
          background:i===1?C.green:C.white, border:`1px solid ${i===1?C.green:C.border}` }}>
          <T s={12} c={i===1?'#fff':C.muted} w={i===1?600:400}>{f}</T>
        </div>
      ))}
      <div style={{ flex:1 }} />
      <WFBtn label="+ Nouvelle tâche" primary small />
      <WFBox width={120} h={32} label="Filtrer par commission" style={{ border:`1px solid ${C.border}`, borderRadius:6 }} />
    </div>
    <div style={{ display:'flex', gap:12 }}>
      {/* Task list */}
      <WFCard style={{ flex:3 }} p={0}>
        {/* Table header */}
        <div style={{ display:'flex', gap:0, padding:'8px 14px', borderBottom:`1px solid ${C.border}`, background:C.bg }}>
          {['Tâche','Commission','Assigné à','Échéance','Priorité','Statut'].map((h,i) => (
            <T key={i} s={10} c={C.subtle} w={600} style={{ flex:[3,2,1.5,1.2,1,1.2][i], textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</T>
          ))}
        </div>
        {[
          { label:'Répondre demande PLU secteur Nord', com:'Travaux', who:'Moi', date:'2 mai', prio:'Urgent', status:'En cours', ps:'danger', ss:'warning' },
          { label:'Valider devis éclairage — route des Combes', com:'Travaux', who:'Moi', date:'5 mai', prio:'Normal', status:'À faire', ps:'default', ss:'default' },
          { label:'Préparer OJ Conseil du 8 mai', com:'Admin', who:'Moi', date:'8 mai', prio:'Normal', status:'À faire', ps:'default', ss:'default' },
          { label:'Signer convention CC Pays de Vernoux', com:'Admin', who:'Moi', date:'10 mai', prio:'Normal', status:'À valider', ps:'default', ss:'terra' },
          { label:'Mise à jour registre état civil Q1', com:'Admin', who:'P. Roche', date:'15 mai', prio:'Faible', status:'En cours', ps:'default', ss:'warning' },
        ].map((t,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:0, padding:'10px 14px',
            borderBottom:`1px solid ${C.border}`, background:i===0?`${C.green}08`:C.white }}>
            <div style={{ flex:3 }}><T s={12} c={C.fg} w={i===0?600:400}>{t.label}</T></div>
            <div style={{ flex:2 }}><WFTag label={t.com} /></div>
            <div style={{ flex:1.5 }}><T s={11} c={C.muted}>{t.who}</T></div>
            <div style={{ flex:1.2 }}><T s={11} c={C.muted}>{t.date}</T></div>
            <div style={{ flex:1 }}><WFBadge label={t.prio} type={t.ps} /></div>
            <div style={{ flex:1.2 }}><WFBadge label={t.status} type={t.ss} /></div>
          </div>
        ))}
      </WFCard>
      {/* Side detail */}
      <WFCard style={{ flex:1.8 }} p={16}>
        <T s={13} c={C.fg} w={700} mb={4}>Répondre demande PLU — secteur Nord</T>
        <WFBadge label="En cours" type="warning" />
        <WFSep my={12} />
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[['Commission','Travaux & Urbanisme'],['Assigné à','Jean Martin (Moi)'],['Créé par','Marie Durand'],['Échéance','2 mai 2026'],['Priorité','Urgente']].map(([k,v],i) => (
            <div key={i} style={{ display:'flex', gap:8 }}>
              <T s={11} c={C.subtle} style={{ width:80, flexShrink:0 }}>{k}</T>
              <T s={11} c={C.fg} w={500}>{v}</T>
            </div>
          ))}
        </div>
        <WFSep my={12} />
        <T s={11} c={C.muted} w={600} mb={6}>Description</T>
        <WFBox width='100%' h={60} label='Texte de description de la tâche' style={{ borderRadius:6 }} />
        <WFSep my={12} />
        <T s={11} c={C.muted} w={600} mb={8}>Commentaires</T>
        <WFBox width='100%' h={40} label='Ajouter un commentaire…' style={{ border:`1px solid ${C.border}`, borderRadius:6, background:C.white, marginBottom:8 }} />
        <div style={{ display:'flex', gap:6 }}>
          <WFBtn label="Marquer terminée" primary small />
          <WFBtn label="Demander validation" small />
        </div>
      </WFCard>
    </div>
  </Shell>
);

const TasksB = () => (
  <Shell title="Tâches — Vue Kanban" active={1}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
      <div style={{ display:'flex', gap:8 }}>
        {['Mes tâches','Toute l\'équipe'].map((f,i) => (
          <div key={i} style={{ padding:'5px 12px', borderRadius:20,
            background:i===0?C.green:C.white, border:`1px solid ${i===0?C.green:C.border}` }}>
            <T s={12} c={i===0?'#fff':C.muted} w={i===0?600:400}>{f}</T>
          </div>
        ))}
      </div>
      <WFBtn label="+ Nouvelle tâche" primary small />
    </div>
    <div style={{ display:'flex', gap:12, height:'calc(100% - 60px)' }}>
      {[
        { col:'À faire', count:6, color:C.subtle, cards:[
          { t:'Préparer OJ Conseil 8 mai', tag:'Admin', prio:'Normal' },
          { t:'Signer convention CC Pays de Vernoux', tag:'Partenariat', prio:'Normal' },
          { t:'Mise à jour site internet — actu mai', tag:'Communication', prio:'Faible' },
        ]},
        { col:'En cours', count:5, color:C.warning, cards:[
          { t:'Répondre demande PLU secteur Nord', tag:'Travaux', prio:'Urgent' },
          { t:'Mise à jour registre état civil Q1', tag:'Admin', prio:'Faible' },
          { t:'Suivi chantier route des Combes', tag:'Travaux', prio:'Normal' },
        ]},
        { col:'En attente validation', count:3, color:C.info, cards:[
          { t:'Signer devis éclairage public', tag:'Travaux', prio:'Normal' },
          { t:'Valider délibération 2026-015', tag:'Admin', prio:'Urgent' },
        ]},
        { col:'Terminé', count:17, color:C.success, cards:[
          { t:'Budget primitif 2026 adopté', tag:'Finance', prio:'—' },
          { t:'CR commission du 12 avril', tag:'Admin', prio:'—' },
        ]},
      ].map((col,ci) => (
        <div key={ci} style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
            <div style={{ width:8,height:8,borderRadius:'50%',background:col.color }} />
            <T s={12} c={C.fg} w={600}>{col.col}</T>
            <div style={{ marginLeft:'auto', background:C.ph, borderRadius:9999, padding:'1px 7px' }}>
              <T s={10} c={C.muted} w={600}>{col.count}</T>
            </div>
          </div>
          <div style={{ flex:1, background:`${col.color}10`, borderRadius:8, padding:8,
            display:'flex', flexDirection:'column', gap:8, border:`1px dashed ${col.color}40` }}>
            {col.cards.map((card,i) => (
              <WFCard key={i} p={10} style={{ cursor:'pointer' }}>
                <T s={12} c={C.fg} w={500} mb={8}>{card.t}</T>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <WFTag label={card.tag} />
                  <WFBadge label={card.prio} type={card.prio==='Urgent'?'danger':card.prio==='Faible'?'default':'primary'} />
                </div>
              </WFCard>
            ))}
            <div style={{ padding:'6px 0', textAlign:'center', cursor:'pointer' }}>
              <T s={11} c={col.color} w={500}>+ Ajouter une tâche</T>
            </div>
          </div>
        </div>
      ))}
    </div>
    <WFNote style={{ marginTop:8 }}>Glisser-déposer entre colonnes</WFNote>
  </Shell>
);

const TasksC = () => (
  <Shell title="Mes tâches" active={1}>
    <div style={{ display:'flex', gap:12 }}>
      <div style={{ flex:3 }}>
        {[
          { heading:"Aujourd'hui", items:[
            { t:'Répondre demande PLU secteur Nord', tag:'Travaux', prio:'danger', time:'Avant 18h' },
            { t:'Valider devis éclairage — route des Combes', tag:'Finance', prio:'warning', time:'En journée' },
          ]},
          { heading:'Cette semaine', items:[
            { t:'Préparer OJ Conseil du 8 mai', tag:'Admin', prio:'default', time:'8 mai' },
            { t:'Signer convention CC Pays de Vernoux', tag:'Partenariat', prio:'default', time:'10 mai' },
          ]},
          { heading:'Plus tard', items:[
            { t:'Mise à jour registre état civil Q1', tag:'Admin', prio:'default', time:'15 mai' },
            { t:'Rapport annuel 2025 — ébauche', tag:'Finance', prio:'default', time:'30 mai' },
          ]},
        ].map((group,gi) => (
          <div key={gi} style={{ marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <T s={11} c={C.subtle} w={700} style={{ textTransform:'uppercase', letterSpacing:'0.08em' }}>{group.heading}</T>
              <div style={{ flex:1, height:1, background:C.border }} />
              <T s={10} c={C.subtle}>{group.items.length} tâche{group.items.length>1?'s':''}</T>
            </div>
            {group.items.map((item,i) => (
              <WFCard key={i} p={12} style={{ marginBottom:6, display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <div style={{ width:18,height:18,borderRadius:4,border:`2px solid ${C.border}`,flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <T s={12} c={C.fg} w={500}>{item.t}</T>
                </div>
                <WFTag label={item.tag} />
                <WFBadge label={item.time} type={item.prio} />
              </WFCard>
            ))}
          </div>
        ))}
      </div>
      {/* Focus panel */}
      <div style={{ flex:1.5, display:'flex', flexDirection:'column', gap:12 }}>
        <WFCard p={14}>
          <T s={12} c={C.fg} w={600} mb={10}>Progression hebdomadaire</T>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:56,height:56,borderRadius:'50%',border:`4px solid ${C.green}`,
              display:'flex',alignItems:'center',justifyContent:'center' }}>
              <T s={14} c={C.green} w={700}>60%</T>
            </div>
            <div>
              <T s={12} c={C.fg} w={600}>6 / 10 terminées</T>
              <T s={10} c={C.subtle}>cette semaine</T>
            </div>
          </div>
          <WFProg pct={60} color={C.green} />
        </WFCard>
        <WFCard p={14}>
          <T s={12} c={C.fg} w={600} mb={8}>Tâches par commission</T>
          {[['Travaux',6,C.terra],['Admin',4,C.slate],['Finance',2,C.green]].map(([n,v,c],i) => (
            <div key={i} style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <T s={11} c={C.fg}>{n}</T><T s={11} c={C.subtle} w={600}>{v}</T>
              </div>
              <WFProg pct={v/6*100} color={c} />
            </div>
          ))}
        </WFCard>
        <WFNote>Vue idéale pour les agents avec forte charge</WFNote>
      </div>
    </div>
  </Shell>
);

// ═══════════════════════════════════════════════════════════════
// MODULE COMMISSIONS
// ═══════════════════════════════════════════════════════════════

const COMMISSIONS = [
  { name:'Admin Générale & Finance', tasks:8, members:5, next:'5 mai', docs:12, color:C.slate },
  { name:'Développement économique', tasks:5, members:4, next:'12 mai', docs:7, color:C.green },
  { name:'Enfance & Jeunesse', tasks:3, members:4, next:'19 mai', docs:5, color:C.terra },
  { name:'Animation & Évènementiel', tasks:1, members:3, next:'26 mai', docs:3, color:C.info },
  { name:'Travaux & Urbanisme', tasks:12, members:5, next:'5 mai', docs:18, color:C.danger },
];

const CommA = () => (
  <Shell title="Commissions" active={2}>
    <SectionHd title="Mes commissions" actions={<WFBtn label="Voir toutes les commissions" small />} />
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
      {COMMISSIONS.map((com,i) => (
        <WFCard key={i} p={16} style={{ cursor:'pointer', borderTop:`3px solid ${com.color}` }}>
          <T s={13} c={C.fg} w={700} mb={12}>{com.name}</T>
          <div style={{ display:'flex', gap:12, marginBottom:12 }}>
            <div><T s={18} c={com.color} w={700}>{com.tasks}</T><T s={9} c={C.subtle}>Tâches</T></div>
            <div><T s={18} c={com.color} w={700}>{com.members}</T><T s={9} c={C.subtle}>Membres</T></div>
            <div><T s={18} c={com.color} w={700}>{com.docs}</T><T s={9} c={C.subtle}>Documents</T></div>
          </div>
          <WFSep my={10} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <T s={11} c={C.subtle}>Prochaine réunion</T>
            <WFBadge label={com.next} type={com.tasks>8?'danger':'default'} />
          </div>
        </WFCard>
      ))}
      {/* Add commission card */}
      <div style={{ border:`2px dashed ${C.border}`, borderRadius:8, display:'flex',
        alignItems:'center', justifyContent:'center', minHeight:140, cursor:'pointer' }}>
        <T s={12} c={C.subtle}>+ Nouvelle commission</T>
      </div>
    </div>
    {/* Recent activity */}
    <WFCard p={16}>
      <SectionHd title="Activité récente des commissions" />
      <WFRow label="CR Commission Travaux uploadé" sub="3 tâches extraites par l'IA — à valider" badge="IA" badgeType="primary" right="Aujourd'hui" dot={C.green} />
      <WFRow label="Délibération 2026-015 soumise" sub="Commission Admin Générale" badge="À valider" badgeType="warning" right="Hier" dot={C.warning} />
      <WFRow label="Réunion Enfance & Jeunesse — CR publié" sub="Synthèse disponible" badge="Publié" badgeType="success" right="28 avr." dot={C.success} last />
    </WFCard>
  </Shell>
);

const CommB = () => (
  <Shell title="Commissions" active={2}>
    <div style={{ display:'flex', gap:0, height:'100%' }}>
      {/* Left list */}
      <div style={{ width:220, borderRight:`1px solid ${C.border}`, paddingRight:12, marginRight:16 }}>
        <T s={11} c={C.subtle} w={700} mb={8} style={{ textTransform:'uppercase', letterSpacing:'0.08em' }}>Commissions</T>
        {COMMISSIONS.map((c,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
            borderRadius:6, background: i===4?C.greenLight:'transparent', marginBottom:2, cursor:'pointer' }}>
            <div style={{ width:8,height:8,borderRadius:'50%',background:c.color,flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <T s={12} c={i===4?C.green:C.fg} w={i===4?600:400}>{c.name}</T>
            </div>
            {c.tasks>5 && <WFBadge label={c.tasks} type={c.tasks>10?'danger':'warning'} />}
          </div>
        ))}
      </div>
      {/* Right detail — Travaux & Urbanisme */}
      <div style={{ flex:1, overflow:'auto' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <T s={18} c={C.fg} w={700}>Travaux & Urbanisme</T>
              <WFBadge label="12 tâches" type="danger" />
            </div>
            <T s={12} c={C.subtle}>Prochaine réunion : 5 mai 2026 · 14h00</T>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <WFBtn label="Comptes rendus" small />
            <WFBtn label="+ Tâche" primary small />
          </div>
        </div>
        <div style={{ display:'flex', gap:12, marginBottom:14 }}>
          <WFKpi label="Tâches actives" value="12" color={C.danger} />
          <WFKpi label="Documents" value="18" color={C.slate} />
          <WFKpi label="Membres" value="5" color={C.green} />
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <div style={{ flex:2, display:'flex', flexDirection:'column', gap:12 }}>
            <WFCard p={14}>
              <SectionHd title="Tâches en cours" />
              <WFRow label="Répondre demande PLU secteur Nord" badge="Urgent" badgeType="danger" sub="Jean Martin · 2 mai" dot={C.danger} />
              <WFRow label="Suivi chantier route des Combes" badge="En cours" badgeType="warning" sub="Laurent Fabre · 15 mai" dot={C.warning} />
              <WFRow label="Dossier permis de construire B-204" badge="À faire" badgeType="default" sub="Marie Durand · 30 mai" dot={C.subtle} last />
            </WFCard>
            <WFCard p={14}>
              <SectionHd title="Comptes rendus" />
              <WFRow label="CR — Réunion du 12 avril 2026" sub="Uploadé · 3 tâches extraites" badge="IA" badgeType="primary" right="12 avr." />
              <WFRow label="CR — Réunion du 5 mars 2026" sub="Archivé" badge="Archivé" badgeType="default" right="5 mars" last />
            </WFCard>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
            <WFCard p={14}>
              <SectionHd title="Membres" />
              {[['Jean Martin','Référent'],['Marie Durand','Adjointe'],['Laurent Fabre','Élu'],['Pierre Roche','Agent'],['S. Bonnet','Élue']].map(([n,r],i) => (
                <div key={i} style={{ display:'flex',alignItems:'center',gap:8,padding:'5px 0',
                  borderBottom:i<4?`1px solid ${C.border}`:'none' }}>
                  <WFAvatar initials={n.split(' ').map(x=>x[0]).join('')} size={22} color={[C.slate,C.green,C.terra,C.subtle,C.info][i]} />
                  <div><T s={11} c={C.fg} w={500}>{n}</T><T s={9} c={C.subtle}>{r}</T></div>
                </div>
              ))}
            </WFCard>
          </div>
        </div>
      </div>
    </div>
  </Shell>
);

const CommC = () => (
  <Shell title="Commissions — Timeline" active={2}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
      <div style={{ display:'flex', gap:8 }}>
        {COMMISSIONS.map((c,i) => (
          <div key={i} style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 10px',
            borderRadius:20,border:`1px solid ${c.color}40`,background:`${c.color}12`,cursor:'pointer' }}>
            <div style={{ width:6,height:6,borderRadius:'50%',background:c.color }} />
            <T s={10} c={c.color} w={600}>{c.name.split(' ')[0]}</T>
          </div>
        ))}
      </div>
      <div style={{ display:'flex',gap:8 }}>
        <WFBtn label="← Avr." small />
        <T s={12} c={C.fg} w={600} style={{ padding:'4px 8px' }}>Mai 2026</T>
        <WFBtn label="Juin →" small />
      </div>
    </div>
    {/* Timeline */}
    <WFCard p={16}>
      {/* Day headers */}
      <div style={{ display:'flex', marginBottom:8, paddingLeft:180 }}>
        {['1','5','10','15','20','25','30'].map(d => (
          <T key={d} s={10} c={C.subtle} style={{ flex:1, textAlign:'center' }}>{d} mai</T>
        ))}
      </div>
      {/* Commission rows */}
      {COMMISSIONS.map((com,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:0, marginBottom:10 }}>
          <div style={{ width:180, flexShrink:0, paddingRight:12 }}>
            <T s={11} c={C.fg} w={600}>{com.name.split(' ')[0]} {com.name.split(' ')[1]}</T>
            <T s={9} c={C.subtle}>{com.tasks} tâches · {com.members} membres</T>
          </div>
          <div style={{ flex:1, height:28, background:`${com.color}12`, borderRadius:6,
            position:'relative', border:`1px solid ${com.color}25` }}>
            {/* Meeting dot */}
            <div style={{ position:'absolute', left:`${[15,35,55,70,15][i]}%`,top:'50%',transform:'translateY(-50%)',
              width:16,height:16,borderRadius:'50%',background:com.color,
              display:'flex',alignItems:'center',justifyContent:'center' }}>
              <T s={8} c='#fff' w={700}>R</T>
            </div>
            {/* Task bar */}
            <div style={{ position:'absolute', left:`${[5,20,40,60,5][i]}%`,
              width:`${[40,30,25,20,55][i]}%`, top:8, height:12,
              background:`${com.color}40`, borderRadius:4 }} />
          </div>
        </div>
      ))}
      {/* Legend */}
      <div style={{ display:'flex',gap:16,marginTop:12,paddingTop:10,borderTop:`1px solid ${C.border}` }}>
        <div style={{ display:'flex',alignItems:'center',gap:5 }}>
          <div style={{ width:14,height:14,borderRadius:'50%',background:C.slate,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <T s={7} c='#fff'>R</T></div>
          <T s={10} c={C.subtle}>Réunion</T>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:5 }}>
          <div style={{ width:30,height:10,borderRadius:4,background:`${C.slate}40` }} />
          <T s={10} c={C.subtle}>Période de tâches actives</T>
        </div>
      </div>
    </WFCard>
    {/* Upcoming meetings */}
    <div style={{ display:'flex',gap:12,marginTop:12 }}>
      <WFCard p={14} style={{ flex:1 }}>
        <SectionHd title="Prochaines réunions" />
        {[
          { d:'5 mai', com:'Travaux & Urbanisme', h:'14h00' },
          { d:'5 mai', com:'Admin & Finance', h:'18h30' },
          { d:'12 mai', com:'Développement', h:'14h00' },
          { d:'19 mai', com:'Enfance & Jeunesse', h:'18h00' },
        ].map((m,i) => (
          <WFRow key={i} label={`${m.d} — ${m.com}`} sub={m.h} dot={COMMISSIONS[i]?.color} last={i===3} />
        ))}
      </WFCard>
      <WFCard p={14} style={{ flex:1 }}>
        <SectionHd title="Tâches échéances proches" />
        <WFRow label="Répondre PLU secteur Nord" sub="2 mai — Travaux" badge="Urgent" badgeType="danger" dot={C.danger} />
        <WFRow label="Devis éclairage public" sub="5 mai — Finance" badge="Normal" badgeType="default" dot={C.warning} />
        <WFRow label="OJ Conseil du 8 mai" sub="8 mai — Admin" badge="Normal" badgeType="default" dot={C.subtle} last />
      </WFCard>
    </div>
  </Shell>
);

Object.assign(window, {
  LoginA, LoginB, LoginC,
  DashA, DashB, DashC,
  TasksA, TasksB, TasksC,
  CommA, CommB, CommC,
});
