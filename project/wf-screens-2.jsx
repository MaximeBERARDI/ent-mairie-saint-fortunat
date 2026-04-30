// wf-screens-2.jsx — Comptes rendus + IA, RH, Finance

const { C, T, WFBox, WFCard, WFKpi, WFBadge, WFBtn, WFProg, WFRow, WFSep,
  WFAvatar, WFTag, WFNote, WFStep, Shell, SectionHd } = window;

// ═══════════════════════════════════════════════════════════════
// COMPTES RENDUS + IA
// ═══════════════════════════════════════════════════════════════

const CRIA_A = () => (
  <Shell title="Comptes rendus" active={3} notif={1}>
    {/* Upload + flow */}
    <div style={{ display:'flex', gap:12 }}>
      {/* Left: upload + processing */}
      <div style={{ flex:2, display:'flex', flexDirection:'column', gap:12 }}>
        {/* Upload zone */}
        <WFCard p={16}>
          <SectionHd title="Importer un compte rendu" />
          <div style={{ border:`2px dashed ${C.green}`, borderRadius:10, padding:28, textAlign:'center',
            background:C.greenLight, marginBottom:12 }}>
            <WFBox width={40} h={40} color={C.greenMid} round={8} style={{ margin:'0 auto 10px' }} />
            <T s={13} c={C.green} w={600} mb={4}>Glissez votre fichier ici</T>
            <T s={11} c={C.subtle} mb={12}>PDF, DOCX, TXT — Max 20 Mo</T>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <WFBtn label="Parcourir les fichiers" primary small />
              <WFBtn label="Depuis Hupmeet" small />
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <WFBox width='100%' h={36} label='Affecter à une commission…' style={{ border:`1px solid ${C.border}`, borderRadius:6, background:C.white }} />
            <WFBox width={140} h={36} label='Date de la réunion' style={{ border:`1px solid ${C.border}`, borderRadius:6, background:C.white, flexShrink:0 }} />
          </div>
        </WFCard>
        {/* IA Processing — état "en cours" */}
        <WFCard p={16}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:28,height:28,borderRadius:'50%',background:C.greenLight,
              border:`2px solid ${C.green}`, display:'flex',alignItems:'center',justifyContent:'center' }}>
              <T s={11} c={C.green} w={700}>IA</T>
            </div>
            <div>
              <T s={13} c={C.fg} w={700}>Extraction en cours…</T>
              <T s={10} c={C.subtle}>CR Commission Travaux — 12 avril 2026</T>
            </div>
            <div style={{ marginLeft:'auto' }}>
              <WFBadge label="Traitement IA" type="primary" />
            </div>
          </div>
          {/* Progress steps */}
          {[
            { label:'Lecture et indexation du document', done:true },
            { label:'Identification des décisions et actions', done:true },
            { label:'Extraction des tâches et responsables', done:false, active:true },
            { label:'Proposition d\'affectation par rôle', done:false },
          ].map((step,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0',
              borderBottom:i<3?`1px solid ${C.border}`:'none' }}>
              <div style={{ width:18,height:18,borderRadius:'50%',flexShrink:0,
                background:step.done?C.success:step.active?C.warning:'#e2e6e3',
                display:'flex',alignItems:'center',justifyContent:'center' }}>
                {step.done && <T s={9} c='#fff' w={700}>✓</T>}
                {step.active && <div style={{ width:6,height:6,borderRadius:'50%',background:'#fff' }} />}
              </div>
              <T s={12} c={step.done?C.success:step.active?C.warning:C.subtle}
                w={step.active?600:400}>{step.label}</T>
              {step.active && <WFBadge label="En cours…" type="warning" />}
            </div>
          ))}
          <div style={{ marginTop:12, height:4, borderRadius:2, background:C.ph, overflow:'hidden' }}>
            <div style={{ width:'65%',height:'100%',background:C.green,borderRadius:2 }} />
          </div>
          <T s={10} c={C.subtle} style={{ marginTop:4 }}>Analyse : 65% — environ 30 secondes restantes</T>
        </WFCard>
      </div>
      {/* Right: extracted tasks + validation */}
      <div style={{ flex:3 }}>
        <WFCard p={16} style={{ height:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <T s={14} c={C.fg} w={700} style={{ flex:1 }}>Tâches extraites par l'IA</T>
            <WFBadge label="5 propositions" type="primary" />
            <WFBtn label="Tout valider" primary small />
          </div>
          {[
            { task:'Répondre à la demande de permis de construire — parcelle B-204', who:'Marie Durand', date:'15 mai', conf:95, status:'suggestion' },
            { task:'Finaliser le dossier PLU révision secteur Nord', who:'Jean Martin', date:'30 mai', conf:88, status:'suggestion' },
            { task:'Commander les panneaux de signalisation route des Combes', who:'Laurent Fabre', date:'20 mai', conf:82, status:'modifié' },
            { task:'Vérifier la conformité du chantier école', who:'Pierre Roche', date:'10 mai', conf:74, status:'suggestion' },
            { task:'Mettre à jour le registre des travaux Q2', who:'Pierre Roche', date:'30 mai', conf:61, status:'suggestion' },
          ].map((item,i) => (
            <div key={i} style={{ border:`1px solid ${item.status==='modifié'?C.warning:C.border}`, borderRadius:8,
              padding:12, marginBottom:8, background:item.status==='modifié'?C.warningLight:C.white }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <T s={12} c={C.fg} w={500} mb={4}>{item.task}</T>
                  <div style={{ display:'flex', gap:6 }}>
                    <WFBadge label={`Confiance : ${item.conf}%`} type={item.conf>80?'success':item.conf>70?'warning':'danger'} />
                    {item.status==='modifié' && <WFBadge label="Modifié" type="terra" />}
                  </div>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <WFBtn label="✓" primary small style={{ padding:'3px 8px' }} />
                  <WFBtn label="✕" danger small style={{ padding:'3px 8px' }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <WFBox width='100%' h={28} label={`Assigné à : ${item.who}`} color={C.bg}
                  style={{ border:`1px solid ${C.border}`, borderRadius:5 }} />
                <WFBox width={110} h={28} label={item.date} color={C.bg}
                  style={{ border:`1px solid ${C.border}`, borderRadius:5, flexShrink:0 }} />
                <WFBox width={120} h={28} label='Commission…' color={C.bg}
                  style={{ border:`1px solid ${C.border}`, borderRadius:5, flexShrink:0 }} />
              </div>
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <WFBtn label="Valider la sélection et notifier les assignés" primary style={{ flex:1, justifyContent:'center' }} />
            <WFBtn label="Tout rejeter" />
          </div>
        </WFCard>
      </div>
    </div>
  </Shell>
);

const CRIA_B = () => (
  <Shell title="Comptes rendus" active={3}>
    {/* CR List header */}
    <div style={{ display:'flex', gap:8, marginBottom:12 }}>
      <WFBtn label="+ Importer un CR" primary small />
      <div style={{ flex:1 }} />
      <WFBox width={180} h={32} label='Filtrer par commission…' style={{ border:`1px solid ${C.border}`, borderRadius:6 }} />
    </div>
    <div style={{ display:'flex', gap:12, height:'calc(100% - 50px)' }}>
      {/* Left: document viewer */}
      <WFCard style={{ flex:2 }} p={0}>
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:8 }}>
          <T s={13} c={C.fg} w={600} style={{ flex:1 }}>CR — Commission Travaux — 12 avril 2026</T>
          <WFBadge label="PDF" type="default" />
          <WFBtn label="Télécharger" small />
        </div>
        <div style={{ padding:16, overflow:'auto' }}>
          <T s={12} c={C.muted} w={600} mb={8}>Présents : J. Martin, M. Durand, L. Fabre, P. Roche, S. Bonnet</T>
          <T s={11} c={C.muted} w={600} mb={4} style={{ textTransform:'uppercase', letterSpacing:'0.06em' }}>1. Approbation du compte rendu précédent</T>
          <WFBox width='100%' h={36} label='Paragraphe de texte…' style={{ marginBottom:8, borderRadius:4 }} />
          <T s={11} c={C.muted} w={600} mb={4} style={{ textTransform:'uppercase', letterSpacing:'0.06em' }}>2. Suivi chantier route des Combes</T>
          {/* Highlighted passage */}
          <div style={{ background:C.warningLight, border:`1px solid ${C.warning}30`, borderRadius:4, padding:'6px 10px', marginBottom:6, position:'relative' }}>
            <div style={{ position:'absolute', left:-8, top:'50%', transform:'translateY(-50%)',
              width:16,height:16,borderRadius:'50%',background:C.warning,
              display:'flex',alignItems:'center',justifyContent:'center' }}>
              <T s={8} c='#fff' w={700}>IA</T>
            </div>
            <T s={11} c={C.fg}>"L. Fabre est chargé de commander les panneaux de signalisation avant le 20 mai."</T>
          </div>
          <WFBox width='100%' h={32} label='Suite du texte…' style={{ marginBottom:8, borderRadius:4 }} />
          <T s={11} c={C.muted} w={600} mb={4} style={{ textTransform:'uppercase', letterSpacing:'0.06em' }}>3. Dossier PLU — secteur Nord</T>
          <div style={{ background:C.greenLight, border:`1px solid ${C.green}30`, borderRadius:4, padding:'6px 10px', marginBottom:6, position:'relative' }}>
            <div style={{ position:'absolute', left:-8, top:'50%', transform:'translateY(-50%)',
              width:16,height:16,borderRadius:'50%',background:C.green,
              display:'flex',alignItems:'center',justifyContent:'center' }}>
              <T s={8} c='#fff' w={700}>IA</T>
            </div>
            <T s={11} c={C.fg}>"Le dossier PLU doit être finalisé par J. Martin et M. Durand avant la fin mai."</T>
          </div>
          <WFBox width='100%' h={56} label='Fin du document…' style={{ borderRadius:4 }} />
        </div>
      </WFCard>
      {/* Right: extracted tasks */}
      <div style={{ flex:1.8, display:'flex', flexDirection:'column', gap:0 }}>
        <WFCard style={{ flex:1 }} p={0}>
          <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`,
            background:`${C.green}08`, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:20,height:20,borderRadius:'50%',background:C.green,flexShrink:0,
              display:'flex',alignItems:'center',justifyContent:'center' }}>
              <T s={9} c='#fff' w={700}>IA</T>
            </div>
            <T s={13} c={C.fg} w={700} style={{ flex:1 }}>5 tâches extraites</T>
            <WFBtn label="Tout valider" primary small />
          </div>
          <div style={{ padding:12, overflow:'auto' }}>
            {[
              { task:'Répondre permis de construire B-204', who:'M. Durand', conf:95, ok:true },
              { task:'Finaliser dossier PLU secteur Nord', who:'J. Martin', conf:88, ok:true },
              { task:'Commander panneaux — route des Combes', who:'L. Fabre', conf:82, ok:false },
              { task:'Vérifier conformité chantier école', who:'P. Roche', conf:74, ok:null },
              { task:'Mettre à jour registre travaux Q2', who:'P. Roche', conf:61, ok:null },
            ].map((item,i) => (
              <div key={i} style={{ padding:'8px 0', borderBottom:i<4?`1px solid ${C.border}`:'none' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:6, marginBottom:4 }}>
                  <div style={{ width:14,height:14,borderRadius:3,flexShrink:0,marginTop:1,
                    background:item.ok===true?C.success:item.ok===false?C.dangerLight:'#e2e6e3',
                    border:`1.5px solid ${item.ok===true?C.success:item.ok===false?C.danger:C.border}`,
                    display:'flex',alignItems:'center',justifyContent:'center' }}>
                    {item.ok===true && <T s={8} c='#fff' w={700}>✓</T>}
                    {item.ok===false && <T s={8} c={C.danger} w={700}>✕</T>}
                  </div>
                  <T s={12} c={C.fg} w={500} style={{ flex:1 }}>{item.task}</T>
                </div>
                <div style={{ display:'flex', gap:6, paddingLeft:20 }}>
                  <WFAvatar initials={item.who.replace('.','').split(' ').map(x=>x[0]).join('')} size={16} color={C.slate} />
                  <T s={10} c={C.muted}>{item.who}</T>
                  <WFBadge label={`${item.conf}%`} type={item.conf>80?'success':item.conf>70?'warning':'danger'} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding:'10px 12px', borderTop:`1px solid ${C.border}`, display:'flex', gap:6 }}>
            <WFBtn label="Valider et notifier" primary style={{ flex:1, justifyContent:'center' }} />
            <WFBtn label="Rejeter tout" />
          </div>
        </WFCard>
      </div>
    </div>
  </Shell>
);

const CRIA_C = () => (
  <Shell title="Comptes rendus — Nouveau" active={3}>
    <WFStep steps={['Upload','Extraction IA','Validation tâches','Notification']} current={2} />
    <div style={{ display:'flex', gap:12 }}>
      {/* Main: validation */}
      <div style={{ flex:3, display:'flex', flexDirection:'column', gap:12 }}>
        <WFCard p={16}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14,
            padding:'10px 12px', background:C.greenLight, borderRadius:8 }}>
            <div style={{ width:28,height:28,borderRadius:'50%',background:C.green,
              display:'flex',alignItems:'center',justifyContent:'center', flexShrink:0 }}>
              <T s={10} c='#fff' w={700}>IA</T>
            </div>
            <div>
              <T s={12} c={C.green} w={700}>Extraction terminée</T>
              <T s={10} c={C.muted}>5 tâches identifiées dans le CR — Commission Travaux du 12 avril</T>
            </div>
          </div>
          <T s={13} c={C.fg} w={600} mb={12}>Validez et ajustez les tâches proposées</T>
          <div style={{ display:'flex', gap:8, marginBottom:10, padding:'6px 8px', background:C.bg, borderRadius:6 }}>
            <T s={11} c={C.subtle} style={{ flex:1.5 }}>Tâche</T>
            <T s={11} c={C.subtle} style={{ flex:1 }}>Assigné à</T>
            <T s={11} c={C.subtle} style={{ flex:0.8 }}>Échéance</T>
            <T s={11} c={C.subtle} style={{ flex:0.8 }}>Commission</T>
            <T s={11} c={C.subtle} style={{ flex:0.5 }}>Action</T>
          </div>
          {[
            { task:'Répondre permis construire B-204', who:'M. Durand', date:'15 mai', com:'Travaux' },
            { task:'Finaliser dossier PLU secteur Nord', who:'J. Martin', date:'30 mai', com:'Travaux' },
            { task:'Commander panneaux signalisation', who:'L. Fabre', date:'20 mai', com:'Travaux' },
            { task:'Vérifier conformité chantier école', who:'P. Roche', date:'10 mai', com:'Travaux' },
            { task:'Mettre à jour registre travaux Q2', who:'P. Roche', date:'30 mai', com:'Travaux' },
          ].map((row,i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:6, alignItems:'center' }}>
              <div style={{ flex:1.5 }}>
                <WFBox width='100%' h={30} label={row.task} color={C.white}
                  style={{ border:`1px solid ${C.border}`, borderRadius:5 }} />
              </div>
              <div style={{ flex:1 }}>
                <WFBox width='100%' h={30} label={row.who} color={C.white}
                  style={{ border:`1px solid ${C.border}`, borderRadius:5 }} />
              </div>
              <div style={{ flex:0.8 }}>
                <WFBox width='100%' h={30} label={row.date} color={C.white}
                  style={{ border:`1px solid ${C.border}`, borderRadius:5 }} />
              </div>
              <div style={{ flex:0.8 }}>
                <WFBox width='100%' h={30} label={row.com} color={C.white}
                  style={{ border:`1px solid ${C.border}`, borderRadius:5 }} />
              </div>
              <div style={{ flex:0.5, display:'flex', gap:4 }}>
                <WFBtn label="✓" primary small style={{ padding:'3px 7px' }} />
                <WFBtn label="✕" danger small style={{ padding:'3px 7px' }} />
              </div>
            </div>
          ))}
          <WFBtn label="+ Ajouter une tâche manuellement" small style={{ marginTop:6 }} />
        </WFCard>
      </div>
      {/* Summary sidebar */}
      <div style={{ flex:1.2, display:'flex', flexDirection:'column', gap:12 }}>
        <WFCard p={14}>
          <T s={12} c={C.fg} w={600} mb={10}>Récapitulatif</T>
          {[['Document','CR Travaux 12/04'],['Commission','Travaux & Urbanisme'],['Tâches extraites','5'],['Validées','3 / 5'],['À traiter','2 restantes']].map(([k,v],i) => (
            <div key={i} style={{ display:'flex', gap:6, padding:'4px 0', borderBottom:i<4?`1px solid ${C.border}`:'none' }}>
              <T s={10} c={C.subtle} style={{ width:100, flexShrink:0 }}>{k}</T>
              <T s={10} c={C.fg} w={500}>{v}</T>
            </div>
          ))}
        </WFCard>
        <WFCard p={14}>
          <T s={12} c={C.fg} w={600} mb={8}>Personnes à notifier</T>
          {[['M. Durand','1 tâche'],['J. Martin','1 tâche'],['L. Fabre','1 tâche'],['P. Roche','2 tâches']].map(([n,t],i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 0',
              borderBottom:i<3?`1px solid ${C.border}`:'none' }}>
              <WFAvatar initials={n.split(' ').map(x=>x[0]).join('')} size={20} color={[C.green,C.slate,C.terra,C.subtle][i]} />
              <T s={11} c={C.fg} style={{ flex:1 }}>{n}</T>
              <T s={10} c={C.subtle}>{t}</T>
            </div>
          ))}
        </WFCard>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <WFBtn label="← Retour à l'extraction" style={{ width:'100%', justifyContent:'center' }} />
          <WFBtn label="Valider et notifier →" primary style={{ width:'100%', justifyContent:'center' }} />
        </div>
      </div>
    </div>
  </Shell>
);

// ═══════════════════════════════════════════════════════════════
// MODULE RH
// ═══════════════════════════════════════════════════════════════

const EMPLOYES = [
  { nom:'Pierre Roche', poste:'Agent — Secrétariat', statut:'Présent', conges:12, rtt:3, contrat:'Titulaire' },
  { nom:'Isabelle Morel', poste:'Adjointe administrative', statut:'Congé', conges:4, rtt:0, contrat:'Titulaire' },
  { nom:'Thomas Girard', poste:'Agent technique', statut:'Présent', conges:18, rtt:5, contrat:'Titulaire' },
  { nom:'Lucie Bernard', poste:'ATSEM — École', statut:'Présent', conges:8, rtt:2, contrat:'Contractuel' },
  { nom:'Marc Faure', poste:'Agent voirie', statut:'Absent', conges:22, rtt:7, contrat:'Titulaire' },
  { nom:'Anne Dupont', poste:'Agent technique', statut:'Présent', conges:15, rtt:3, contrat:'Contractuel' },
  { nom:'Claude Viard', poste:'Services généraux', statut:'Présent', conges:10, rtt:1, contrat:'Titulaire' },
];

const RH_A = () => (
  <Shell title="Ressources humaines" active={4}>
    <div style={{ display:'flex', gap:12, marginBottom:16 }}>
      <WFKpi label="Effectifs" value="7" sub="agents et personnels" />
      <WFKpi label="En congé aujourd'hui" value="1" sub="Isabelle Morel" color={C.terra} />
      <WFKpi label="Masse salariale / mois" value="21 400 €" sub="brut chargé" color={C.slate} />
      <WFKpi label="Alertes RTT" value="2" sub="stock > 5 jours à prendre" color={C.warning} />
    </div>
    <div style={{ display:'flex', gap:12 }}>
      <WFCard style={{ flex:3 }} p={0}>
        <div style={{ padding:'8px 16px', borderBottom:`1px solid ${C.border}`, background:C.bg,
          display:'flex', alignItems:'center', gap:8 }}>
          <T s={11} c={C.subtle} w={600} style={{ textTransform:'uppercase', letterSpacing:'0.06em', flex:2 }}>Nom / Poste</T>
          <T s={11} c={C.subtle} w={600} style={{ textTransform:'uppercase', letterSpacing:'0.06em', flex:1 }}>Statut</T>
          <T s={11} c={C.subtle} w={600} style={{ textTransform:'uppercase', letterSpacing:'0.06em', flex:0.8 }}>Congés rest.</T>
          <T s={11} c={C.subtle} w={600} style={{ textTransform:'uppercase', letterSpacing:'0.06em', flex:0.8 }}>RTT rest.</T>
          <T s={11} c={C.subtle} w={600} style={{ textTransform:'uppercase', letterSpacing:'0.06em', flex:1 }}>Contrat</T>
          <T s={11} c={C.subtle} w={600} style={{ textTransform:'uppercase', letterSpacing:'0.06em', flex:0.6 }}>Actions</T>
        </div>
        {EMPLOYES.map((e,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px',
            borderBottom:i<EMPLOYES.length-1?`1px solid ${C.border}`:'none',
            background:e.statut==='Absent'||e.statut==='Congé'?`${C.terra}06`:C.white }}>
            <div style={{ flex:2, display:'flex', alignItems:'center', gap:8 }}>
              <WFAvatar initials={e.nom.split(' ').map(x=>x[0]).join('')} size={26}
                color={e.statut==='Présent'?C.green:e.statut==='Congé'?C.terra:C.danger} />
              <div><T s={12} c={C.fg} w={500}>{e.nom}</T><T s={10} c={C.subtle}>{e.poste}</T></div>
            </div>
            <div style={{ flex:1 }}>
              <WFBadge label={e.statut} type={e.statut==='Présent'?'success':e.statut==='Congé'?'terra':'danger'} />
            </div>
            <T s={12} c={e.conges<8?C.warning:C.fg} w={e.conges<8?600:400} style={{ flex:0.8 }}>{e.conges}j</T>
            <div style={{ flex:0.8 }}>
              {e.rtt>5
                ? <><T s={12} c={C.warning} w={600}>{e.rtt}j</T><WFNote style={{ fontSize:9, marginLeft:4 }}>⚠ à prendre</WFNote></>
                : <T s={12} c={C.fg}>{e.rtt}j</T>}
            </div>
            <div style={{ flex:1 }}><WFBadge label={e.contrat} type="default" /></div>
            <div style={{ flex:0.6, display:'flex', gap:4 }}>
              <WFBtn label="Fiche" small />
            </div>
          </div>
        ))}
      </WFCard>
      <div style={{ flex:1.5, display:'flex', flexDirection:'column', gap:12 }}>
        <WFCard p={14}>
          <SectionHd title="Demandes en attente" />
          <WFRow label="Marc Faure — Congé 20-28 mai" sub="Posé le 28 avr." badge="À valider" badgeType="warning" dot={C.warning} />
          <WFRow label="Lucie Bernard — RTT 15 mai" sub="Posé le 30 avr." badge="À valider" badgeType="warning" dot={C.warning} last />
          <div style={{ display:'flex', gap:6, marginTop:10 }}>
            <WFBtn label="Valider" primary small />
            <WFBtn label="Refuser" danger small />
          </div>
        </WFCard>
        <WFCard p={14}>
          <SectionHd title="Actions rapides" />
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <WFBtn label="Générer les fiches de paie" style={{ width:'100%', justifyContent:'center' }} />
            <WFBtn label="Exporter rapport RH" style={{ width:'100%', justifyContent:'center' }} />
            <WFBtn label="+ Nouveau salarié" style={{ width:'100%', justifyContent:'center' }} />
          </div>
        </WFCard>
      </div>
    </div>
  </Shell>
);

const RH_B = () => (
  <Shell title="Ressources humaines — Absences" active={4}>
    <div style={{ display:'flex', gap:12 }}>
      {/* Calendar view */}
      <WFCard style={{ flex:3 }} p={16}>
        <div style={{ display:'flex', alignItems:'center', marginBottom:14 }}>
          <T s={14} c={C.fg} w={600} style={{ flex:1 }}>Calendrier des absences — Mai 2026</T>
          <WFBtn label="← Avr." small />
          <T s={12} c={C.fg} w={600} style={{ margin:'0 8px' }}>Mai</T>
          <WFBtn label="Juin →" small />
        </div>
        {/* Calendar grid */}
        <div style={{ display:'grid', gridTemplateColumns:'120px repeat(5,1fr)', gap:0, border:`1px solid ${C.border}`, borderRadius:6, overflow:'hidden' }}>
          {/* Headers */}
          <div style={{ padding:'6px 8px', background:C.bg, borderRight:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
            <T s={10} c={C.subtle} w={600}>Agent</T>
          </div>
          {['Sem. 18 (1-5)','Sem. 19 (8-12)','Sem. 20 (15-19)','Sem. 21 (22-26)','Sem. 22 (29-31)'].map((w,i) => (
            <div key={i} style={{ padding:'6px 8px', background:C.bg, borderRight:i<4?`1px solid ${C.border}`:'none', borderBottom:`1px solid ${C.border}` }}>
              <T s={9} c={C.subtle} w={600}>{w}</T>
            </div>
          ))}
          {/* Rows */}
          {EMPLOYES.map((e,i) => (
            <React.Fragment key={i}>
              <div style={{ padding:'8px', borderRight:`1px solid ${C.border}`, borderBottom:i<EMPLOYES.length-1?`1px solid ${C.border}`:'none', background:C.white }}>
                <T s={11} c={C.fg} w={500}>{e.nom.split(' ')[0]} {e.nom.split(' ')[1][0]}.</T>
              </div>
              {[0,1,2,3,4].map(wi => {
                const isAbsent = (i===1 && wi===1) || (i===4 && wi===2) || (i===4 && wi===3);
                const isPartial = i===3 && wi===2;
                return (
                  <div key={wi} style={{ padding:4, borderRight:wi<4?`1px solid ${C.border}`:'none',
                    borderBottom:i<EMPLOYES.length-1?`1px solid ${C.border}`:'none', background:C.white }}>
                    {isAbsent && <div style={{ height:24,borderRadius:4,background:`${C.terra}30`,
                      border:`1px solid ${C.terra}40`, display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <T s={9} c={C.terra} w={600}>Congé</T></div>}
                    {isPartial && <div style={{ height:24,borderRadius:4,background:`${C.warning}25`,
                      border:`1px solid ${C.warning}40`, display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <T s={9} c={C.warning} w={600}>RTT</T></div>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display:'flex',gap:12,marginTop:10 }}>
          {[['Congé annuel',C.terra],['RTT',C.warning],['Absence maladie',C.danger]].map(([l,c],i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:4 }}>
              <div style={{ width:12,height:12,borderRadius:2,background:`${c}30`,border:`1px solid ${c}40` }} />
              <T s={10} c={C.subtle}>{l}</T>
            </div>
          ))}
        </div>
      </WFCard>
      {/* Right: masse salariale */}
      <div style={{ flex:1.5, display:'flex', flexDirection:'column', gap:12 }}>
        <WFCard p={14}>
          <T s={13} c={C.fg} w={700} mb={14}>Masse salariale</T>
          <T s={26} c={C.slate} w={700} mb={2}>21 400 €</T>
          <T s={10} c={C.subtle} mb={14}>brut chargé / mois</T>
          {[
            { label:'Titulaires (5)', val:16800, pct:78 },
            { label:'Contractuels (2)', val:4600, pct:22 },
          ].map((item,i) => (
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                <T s={11} c={C.fg}>{item.label}</T>
                <T s={11} c={C.muted} w={600}>{item.val.toLocaleString()} €</T>
              </div>
              <WFProg pct={item.pct} color={i===0?C.slate:C.terra} />
            </div>
          ))}
          <WFSep />
          <WFBtn label="Générer fiches de paie — mai" primary style={{ width:'100%', justifyContent:'center' }} />
        </WFCard>
        <WFCard p={14}>
          <T s={12} c={C.fg} w={600} mb={8}>Soldes de congés</T>
          {EMPLOYES.slice(0,5).map((e,i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:7 }}>
              <T s={11} c={C.fg} style={{ flex:1 }}>{e.nom.split(' ')[0]}</T>
              <T s={11} c={e.conges<8?C.warning:C.fg} w={600}>{e.conges}j</T>
              <WFProg pct={e.conges/25*100} color={e.conges<8?C.warning:C.green} />
            </div>
          ))}
        </WFCard>
      </div>
    </div>
  </Shell>
);

const RH_C = () => (
  <Shell title="Ressources humaines — Dashboard" active={4}>
    {/* Alert */}
    <div style={{ background:C.warningLight, border:`1px solid ${C.warning}40`, borderRadius:8,
      padding:'10px 16px', display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
      <div style={{ width:8,height:8,borderRadius:'50%',background:C.warning,flexShrink:0 }} />
      <T s={13} c={C.warning} w={600} style={{ flex:1 }}>Marc Faure et Thomas Girard ont un solde RTT supérieur à 5 jours — à régulariser avant juin</T>
      <WFBtn label="Voir les soldes" small style={{ borderColor:C.warning, color:C.warning }} />
    </div>
    <div style={{ display:'flex', gap:12, marginBottom:14 }}>
      <WFKpi label="Effectif total" value="7" sub="5 titulaires · 2 contractuels" />
      <WFKpi label="Présents aujourd'hui" value="6 / 7" sub="1 congé — Isabelle Morel" color={C.green} />
      <WFKpi label="Demandes à traiter" value="2" sub="congés en attente de validation" color={C.warning} />
      <WFKpi label="Masse salariale" value="21 400 €" sub="brut chargé · mai 2026" color={C.slate} />
    </div>
    <div style={{ display:'flex', gap:12 }}>
      {/* Fiche employé sélectionné */}
      <WFCard style={{ flex:2 }} p={16}>
        <SectionHd title="Fiche agent — Pierre Roche"
          actions={<><WFBtn label="← Précédent" small /><WFBtn label="Suivant →" small /></>} />
        <div style={{ display:'flex', gap:16 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, width:80, flexShrink:0 }}>
            <WFAvatar initials='PR' size={56} color={C.slate} />
            <WFBadge label="Présent" type="success" />
          </div>
          <div style={{ flex:1 }}>
            {[['Poste','Agent — Secrétariat'],['Contrat','Titulaire catégorie C'],['Prise de poste','1er sept. 2019'],['Salaire brut','2 100 € / mois'],['Congés restants','12 jours'],['RTT restants','3 jours']].map(([k,v],i) => (
              <div key={i} style={{ display:'flex',gap:8,padding:'5px 0',borderBottom:i<5?`1px solid ${C.border}`:'none' }}>
                <T s={11} c={C.subtle} style={{ width:120,flexShrink:0 }}>{k}</T>
                <T s={11} c={C.fg} w={500}>{v}</T>
              </div>
            ))}
          </div>
        </div>
        <WFSep />
        <T s={12} c={C.fg} w={600} mb={8}>Absences 2026</T>
        <WFBox width='100%' h={60} label='Calendrier annuel simplifié' style={{ borderRadius:6, marginBottom:8 }} />
        <div style={{ display:'flex', gap:6 }}>
          <WFBtn label="Voir la fiche complète" small />
          <WFBtn label="Télécharger fiche de paie" small />
          <WFBtn label="Poser un congé" primary small />
        </div>
      </WFCard>
      {/* Alerts + stats */}
      <div style={{ flex:1.5, display:'flex', flexDirection:'column', gap:12 }}>
        <WFCard p={14}>
          <SectionHd title="Alertes RH" />
          {[
            { text:'RTT à régulariser', who:'Marc Faure (7j) et Thomas Girard (5j)', type:'warning' },
            { text:'Congé à valider', who:'Marc Faure · 20-28 mai', type:'warning' },
            { text:'Contrat à renouveler', who:'Anne Dupont · expire le 30 juin', type:'danger' },
          ].map((a,i) => (
            <div key={i} style={{ display:'flex',gap:8,padding:'8px 0',borderBottom:i<2?`1px solid ${C.border}`:'none' }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:a.type==='warning'?C.warning:C.danger,marginTop:4,flexShrink:0 }} />
              <div><T s={12} c={C.fg} w={500}>{a.text}</T><T s={10} c={C.subtle}>{a.who}</T></div>
            </div>
          ))}
        </WFCard>
        <WFCard p={14}>
          <SectionHd title="Répartition des effectifs" />
          <WFBox width='100%' h={80} label='Graphique donut : Titulaires 71% / Contractuels 29%' style={{ borderRadius:8, marginBottom:10 }} />
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            {[['Titulaires',5,C.slate],['Contractuels',2,C.terra]].map(([l,n,c],i) => (
              <div key={i} style={{ display:'flex',alignItems:'center',gap:4 }}>
                <div style={{ width:10,height:10,borderRadius:'50%',background:c }} />
                <T s={10} c={C.subtle}>{l} ({n})</T>
              </div>
            ))}
          </div>
        </WFCard>
      </div>
    </div>
  </Shell>
);

// ═══════════════════════════════════════════════════════════════
// MODULE FINANCE / FACTURES
// ═══════════════════════════════════════════════════════════════

const FACTURES = [
  { id:'FAC-2026-042', fournisseur:'EDF Collectivités', montant:'1 240 €', poste:'Énergie', date:'28 avr.', statut:'En attente', type:'warning' },
  { id:'FAC-2026-041', fournisseur:'SAUR — Eau potable', montant:'387 €', poste:'Eau & assainissement', date:'25 avr.', statut:'En attente', type:'warning' },
  { id:'FAC-2026-040', fournisseur:'Matériaux du Vivarais', montant:'4 850 €', poste:'Voirie', date:'20 avr.', statut:'Validée', type:'success' },
  { id:'FAC-2026-039', fournisseur:'Signaux Girod', montant:'920 €', poste:'Voirie', date:'15 avr.', statut:'Validée', type:'success' },
  { id:'FAC-2026-038', fournisseur:'La Poste Pro', montant:'145 €', poste:'Fonctionnement', date:'12 avr.', statut:'Rejetée', type:'danger' },
];

const Fin_A = () => (
  <Shell title="Finances — Factures" active={5}>
    <div style={{ display:'flex', gap:12, marginBottom:14 }}>
      <WFKpi label="En attente validation" value="2" sub="1 627 € à valider" color={C.warning} />
      <WFKpi label="Validées ce mois" value="8" sub="12 340 € imputés" color={C.success} />
      <WFKpi label="Rejetées" value="1" sub="commentaire requis" color={C.danger} />
      <WFKpi label="Total dépensé / mois" value="13 967 €" sub="sur budget engagé" color={C.slate} />
    </div>
    <div style={{ display:'flex', gap:12 }}>
      {/* Invoice list */}
      <div style={{ flex:3 }}>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          {['Toutes','En attente (2)','Validées','Rejetées'].map((f,i) => (
            <div key={i} style={{ padding:'5px 12px', borderRadius:20,
              background:i===0?C.green:C.white, border:`1px solid ${i===0?C.green:C.border}` }}>
              <T s={11} c={i===0?'#fff':C.muted} w={i===0?600:400}>{f}</T>
            </div>
          ))}
          <div style={{ flex:1 }} />
          <WFBtn label="+ Soumettre une facture" primary small />
        </div>
        <WFCard p={0}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr 0.8fr 1.2fr 0.7fr 0.9fr 0.8fr',
            padding:'8px 14px', background:C.bg, borderBottom:`1px solid ${C.border}` }}>
            {['N°','Fournisseur','Montant','Poste comptable','Date','Statut','Action'].map(h => (
              <T key={h} s={10} c={C.subtle} w={600} style={{ textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</T>
            ))}
          </div>
          {FACTURES.map((f,i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr 0.8fr 1.2fr 0.7fr 0.9fr 0.8fr',
              padding:'10px 14px', borderBottom:i<FACTURES.length-1?`1px solid ${C.border}`:'none',
              background:f.statut==='En attente'?`${C.warning}06`:C.white, alignItems:'center' }}>
              <T s={11} c={C.subtle} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{f.id}</T>
              <T s={12} c={C.fg} w={500}>{f.fournisseur}</T>
              <T s={12} c={C.fg} w={600}>{f.montant}</T>
              <WFTag label={f.poste} color={C.slate} />
              <T s={11} c={C.subtle}>{f.date}</T>
              <WFBadge label={f.statut} type={f.type} />
              {f.statut==='En attente'
                ? <div style={{ display:'flex',gap:4 }}>
                    <WFBtn label="✓" primary small style={{ padding:'3px 7px' }} />
                    <WFBtn label="✕" danger small style={{ padding:'3px 7px' }} />
                  </div>
                : <WFBtn label="Voir" small />}
            </div>
          ))}
        </WFCard>
      </div>
      {/* Workflow detail */}
      <div style={{ flex:1.8 }}>
        <WFCard p={14}>
          <T s={13} c={C.fg} w={700} mb={4}>FAC-2026-042 — EDF</T>
          <WFBadge label="En attente de validation" type="warning" />
          <WFSep my={12} />
          {[['Fournisseur','EDF Collectivités'],['Montant HT','1 032 €'],['TVA (20%)','208 €'],['Total TTC','1 240 €'],['Poste','Énergie — 60611'],['Justification','Facture électricité Mairie — avril 2026'],['Soumis par','Pierre Roche'],['Date','28 avr. 2026']].map(([k,v],i) => (
            <div key={i} style={{ display:'flex',gap:8,padding:'5px 0',borderBottom:i<7?`1px solid ${C.border}`:'none' }}>
              <T s={10} c={C.subtle} style={{ width:90,flexShrink:0 }}>{k}</T>
              <T s={11} c={C.fg} w={500}>{v}</T>
            </div>
          ))}
          <WFSep my={12} />
          <WFBox width='100%' h={80} label='Aperçu de la facture / pièce jointe' style={{ borderRadius:6, marginBottom:12 }} />
          <T s={11} c={C.muted} w={600} mb={6}>Commentaire (obligatoire si rejet)</T>
          <WFBox width='100%' h={56} color={C.white} label='Votre commentaire…'
            style={{ border:`1px solid ${C.border}`, borderRadius:6, marginBottom:10 }} />
          <div style={{ display:'flex', gap:6 }}>
            <WFBtn label="Valider" primary style={{ flex:1, justifyContent:'center' }} />
            <WFBtn label="Rejeter" danger style={{ flex:1, justifyContent:'center' }} />
          </div>
        </WFCard>
      </div>
    </div>
  </Shell>
);

const Fin_B = () => (
  <Shell title="Finances — Budget 2026" active={5}>
    <div style={{ display:'flex', gap:12, marginBottom:14 }}>
      <WFKpi label="Budget total 2026" value="380 000 €" color={C.slate} />
      <WFKpi label="Consommé" value="159 600 €" sub="42% du budget" color={C.green} />
      <WFKpi label="Reste à engager" value="220 400 €" color={C.muted} />
      <WFKpi label="Postes en alerte" value="2" sub="> 80% consommés" color={C.danger} />
    </div>
    <div style={{ display:'flex', gap:12 }}>
      <WFCard style={{ flex:3 }} p={16}>
        <SectionHd title="Plan comptable — Suivi par poste budgétaire"
          actions={<><WFBtn label="Rapport" small /><WFBtn label="Exporter" small /></>} />
        {[
          { cat:'Dépenses de personnel', postes:[
            { code:'6411', label:'Salaires titulaires', budget:130000, conso:60800, pct:46 },
            { code:'6413', label:'Salaires contractuels', budget:32000, conso:14800, pct:46 },
            { code:'6451', label:'Cotisations URSSAF', budget:28000, conso:13000, pct:46 },
          ]},
          { cat:'Dépenses de fonctionnement', postes:[
            { code:'60611', label:'Énergie — électricité', budget:18000, conso:6240, pct:34 },
            { code:'60612', label:'Eau & assainissement', budget:5000, conso:1548, pct:31 },
            { code:'6135', label:'Locations mobilières', budget:8000, conso:2400, pct:30 },
          ]},
          { cat:'Dépenses d\'équipement & travaux', postes:[
            { code:'2315', label:'Voirie — travaux', budget:95000, conso:68400, pct:72 },
            { code:'2313', label:'Bâtiments communaux', budget:42000, conso:37380, pct:89 },
            { code:'2188', label:'Matériels divers', budget:12000, conso:3600, pct:30 },
          ]},
        ].map((cat,ci) => (
          <div key={ci} style={{ marginBottom:16 }}>
            <T s={11} c={C.slate} w={700} mb={8} style={{ textTransform:'uppercase', letterSpacing:'0.06em' }}>{cat.cat}</T>
            {cat.postes.map((p,pi) => (
              <div key={pi} style={{ display:'grid', gridTemplateColumns:'0.6fr 2fr 1fr 1fr 0.8fr', gap:8,
                alignItems:'center', padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                <T s={10} c={C.subtle} style={{ fontFamily:"'JetBrains Mono',monospace" }}>{p.code}</T>
                <T s={12} c={C.fg}>{p.label}</T>
                <T s={11} c={C.subtle}>{p.budget.toLocaleString()} €</T>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ flex:1 }}><WFProg pct={p.pct} /></div>
                  <T s={11} c={p.pct>85?C.danger:p.pct>65?C.warning:C.success} w={600}>{p.pct}%</T>
                </div>
                <T s={11} c={C.fg} w={600}>{p.conso.toLocaleString()} €</T>
              </div>
            ))}
          </div>
        ))}
      </WFCard>
      {/* Sidebar */}
      <div style={{ flex:1.5, display:'flex', flexDirection:'column', gap:12 }}>
        <WFCard p={14}>
          <T s={12} c={C.fg} w={700} mb={10}>Synthèse globale</T>
          <WFBox width='100%' h={100} label='Graphique anneau : 42% consommé' style={{ borderRadius:8, marginBottom:10 }} />
          {[['Personnel','50%',C.slate],['Fonct.','10%',C.green],['Équipement','40%',C.terra]].map(([l,p,c],i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
              <div style={{ width:10,height:10,borderRadius:'50%',background:c }} />
              <T s={11} c={C.fg} style={{ flex:1 }}>{l}</T>
              <T s={11} c={C.muted} w={600}>{p}</T>
            </div>
          ))}
        </WFCard>
        <WFCard p={14}>
          <T s={12} c={C.fg} w={600} mb={8}>⚠ Postes en alerte</T>
          {[
            { label:'Bâtiments communaux', pct:89, budget:'42 000 €' },
            { label:'Voirie — travaux', pct:72, budget:'95 000 €' },
          ].map((p,i) => (
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                <T s={11} c={C.fg} w={500}>{p.label}</T>
                <T s={11} c={p.pct>85?C.danger:C.warning} w={700}>{p.pct}%</T>
              </div>
              <WFProg pct={p.pct} />
              <T s={9} c={C.subtle}>{p.budget} alloués</T>
            </div>
          ))}
        </WFCard>
        <WFBtn label="Générer rapport budgétaire" style={{ width:'100%', justifyContent:'center' }} />
      </div>
    </div>
  </Shell>
);

const Fin_C = () => (
  <Shell title="Finances — Fournisseurs" active={5}>
    <div style={{ display:'flex', gap:12, height:'100%' }}>
      {/* Supplier list */}
      <div style={{ width:260, flexShrink:0 }}>
        <div style={{ marginBottom:10 }}>
          <WFBox width='100%' h={34} label='Rechercher un fournisseur…'
            style={{ border:`1px solid ${C.border}`, borderRadius:20, background:C.white, marginBottom:8 }} />
          <WFBtn label="+ Nouveau fournisseur" small style={{ width:'100%', justifyContent:'center' }} />
        </div>
        {[
          { name:'EDF Collectivités', total:'14 880 €', cat:'Énergie', active:true },
          { name:'SAUR — Eau potable', total:'4 644 €', cat:'Eau', active:false },
          { name:'Matériaux du Vivarais', total:'68 400 €', cat:'Travaux', active:false },
          { name:'Signaux Girod', total:'3 680 €', cat:'Voirie', active:false },
          { name:'La Poste Pro', total:'1 740 €', cat:'Courrier', active:false },
          { name:'OVHcloud', total:'960 €', cat:'Informatique', active:false },
          { name:'Communauté de Communes', total:'8 200 €', cat:'Partenariat', active:false },
        ].map((s,i) => (
          <div key={i} style={{ padding:'9px 10px', borderRadius:6, cursor:'pointer',
            background:s.active?C.greenLight:'transparent', border:`1px solid ${s.active?C.green:C.border}`,
            marginBottom:4 }}>
            <T s={12} c={s.active?C.green:C.fg} w={s.active?600:400}>{s.name}</T>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:2 }}>
              <WFTag label={s.cat} color={s.active?C.green:C.slate} />
              <T s={10} c={C.subtle} w={600}>{s.total}</T>
            </div>
          </div>
        ))}
      </div>
      {/* Supplier detail — EDF */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
              <WFAvatar initials='EDF' size={36} color={C.warning} />
              <div>
                <T s={16} c={C.fg} w={700}>EDF Collectivités</T>
                <T s={11} c={C.subtle}>Fournisseur d'énergie — Compte 60611</T>
              </div>
            </div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
            <WFBtn label="Modifier" small />
            <WFBtn label="+ Facture" primary small />
          </div>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <WFKpi label="Total facturé 2026" value="14 880 €" />
          <WFKpi label="En attente" value="1 240 €" color={C.warning} />
          <WFKpi label="Dernière facture" value="28 avr." color={C.slate} />
        </div>
        <WFCard p={14}>
          <SectionHd title="Historique des factures" />
          {[
            { id:'FAC-2026-042', montant:'1 240 €', date:'28 avr.', statut:'En attente', type:'warning' },
            { id:'FAC-2026-035', montant:'1 240 €', date:'31 mars', statut:'Validée', type:'success' },
            { id:'FAC-2026-021', montant:'1 240 €', date:'28 fév.', statut:'Validée', type:'success' },
            { id:'FAC-2026-008', montant:'1 240 €', date:'31 jan.', statut:'Validée', type:'success' },
            { id:'FAC-2025-098', montant:'1 360 €', date:'31 déc.', statut:'Validée', type:'success' },
          ].map((f,i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 0',
              borderBottom:i<4?`1px solid ${C.border}`:'none' }}>
              <T s={11} c={C.subtle} style={{ fontFamily:"'JetBrains Mono',monospace", flex:1 }}>{f.id}</T>
              <T s={12} c={C.fg} w={600} style={{ flex:0.8 }}>{f.montant}</T>
              <T s={11} c={C.subtle} style={{ flex:0.6 }}>{f.date}</T>
              <WFBadge label={f.statut} type={f.type} />
              <WFBtn label="Voir" small />
            </div>
          ))}
        </WFCard>
        <WFCard p={14}>
          <SectionHd title="Coordonnées & infos contrat" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[['SIRET','552 081 317 04116'],['N° client','COL-SJM-2019-004'],['Contact','edf-collectivites.fr'],['Délai paiement','30 jours']].map(([k,v],i) => (
              <div key={i} style={{ padding:'6px 8px', background:C.bg, borderRadius:6 }}>
                <T s={9} c={C.subtle} w={600} mb={2}>{k}</T>
                <T s={11} c={C.fg} w={500}>{v}</T>
              </div>
            ))}
          </div>
        </WFCard>
      </div>
    </div>
  </Shell>
);

Object.assign(window, {
  CRIA_A, CRIA_B, CRIA_C,
  RH_A, RH_B, RH_C,
  Fin_A, Fin_B, Fin_C,
});
