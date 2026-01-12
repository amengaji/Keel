import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { 
  ArrowLeft, User, ShieldCheck, IdCard, Anchor, Edit3, 
  MapPin, Ship, GraduationCap, X, Save, CheckCircle2, BookOpen, Activity
} from "lucide-react";
import { Country, State, City } from "country-state-city";

export function AdminCadetDetailPage() {
  const navigate = useNavigate();
  const { cadetId } = useParams();
  const [identity, setIdentity] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [trainingSnapshot, setTrainingSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/admin/cadets", { credentials: "include" });
        const json = await res.json();
        const found = json.data.find((c: any) => String(c.cadet_id) === String(cadetId));
        
        const profileRes = await fetch(`/api/v1/admin/cadets/${cadetId}/profile`, { credentials: "include" });
        const profileJson = await profileRes.json();
        const combined = { ...found, ...(profileJson?.data || {}) };
        
        const trainingRes = await fetch("/api/v1/admin/trainees", { credentials: "include" });
        const trainingJson = await trainingRes.json();
        const trainingData = trainingJson.data.find((t: any) => String(t.cadet_id) === String(cadetId));

        setIdentity(combined);
        setEditForm(combined);
        setTrainingSnapshot(trainingData);

        const assignRes = await fetch(`/api/v1/admin/vessel-assignments?cadet_id=${cadetId}`, { credentials: "include" });
        setAssignments((await assignRes.json()).data || []);
      } catch (err) { toast.error("Load failed"); } finally { setLoading(false); }
    }
    load();
  }, [cadetId]);

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/v1/admin/cadets/${cadetId}/profile`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      setIdentity(editForm);
      setEditModalOpen(false);
      toast.success("Profile Updated");
    } catch (err: any) { toast.error(err.message); }
  };

  /** * NEW: Helper to determine progress bar colour 
   * Red when 0, Orange when >0 and <100, Green when 100
   */
  const getProgressColor = (percent: number) => {
    if (percent === 0) return "bg-red-500";
    if (percent >= 100) return "bg-green-500";
    return "bg-orange-500";
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading...</div>;

  const activeAssign = assignments.find(a => a.status === 'ACTIVE');
  const taskPercent = trainingSnapshot?.completion_percentage || 0;
  const famPercent = 45; // Baseline placeholder

  return (
    <div className="max-w-350 mx-auto space-y-6 pb-20 px-4">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-card border rounded-xl p-4 shadow-sm">
        <button onClick={() => navigate("/admin/cadets")} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={18}/> Back</button>
        <button onClick={() => setEditModalOpen(true)} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 font-bold shadow-lg transition-all"><Edit3 size={16}/> Edit All Information</button>
      </div>

      {/* TOP ROW: BALANCED 1/3 and 2/3 GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* CARD 1: IDENTITY */}
        <div className="bg-card border rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden h-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <div className="w-28 h-28 bg-muted rounded-full flex items-center justify-center mb-6 border-4 border-background shadow-inner">
            <User size={56} className="text-muted-foreground"/>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{identity.cadet_name}</h2>
          <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">{identity.trainee_type?.replace('_', ' ') || 'UNCLASSIFIED'}</p>
          <div className="mt-4"><span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase border border-primary/20">{identity.rank_label || 'NO RANK'}</span></div>
        </div>

        {/* CARD 2: VESSEL & TRAINING STATUS */}
        <div className="lg:col-span-2 bg-card border rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
          <div className="p-4 bg-muted/30 border-b font-bold text-sm flex justify-between items-center">
            <div className="flex items-center gap-2"><Ship size={18} className="text-primary"/> Current Vessel Status</div>
            <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
              <Activity size={12}/> Live Metrics
            </div>
          </div>
          <div className="grow p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT: Vessel Details */}
            <div className="flex flex-col justify-center">
              {activeAssign ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest leading-none">Active Deployment</p>
                  <h4 className="text-4xl font-black text-green-800 uppercase tracking-tighter">{activeAssign.vessel_name}</h4>
                  <p className="text-xs text-muted-foreground font-medium">Onboard since {new Date(activeAssign.start_date).toLocaleDateString()}</p>
                </div>
              ) : (
                <div className="text-center md:text-left">
                  <Anchor size={40} className="text-muted-foreground/20 mb-2 mx-auto md:mx-0"/>
                  <p className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Awaiting Assignment</p>
                </div>
              )}
            </div>

            {/* RIGHT: Progress Bars with dynamic colours */}
            <div className="flex flex-col justify-center space-y-6 border-l border-border/50 pl-8">
               <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><CheckCircle2 size={12} className="text-primary"/> TRB Tasks</label>
                    <span className="text-xs font-bold">{taskPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${getProgressColor(taskPercent)}`} 
                      style={{ width: `${taskPercent}%` }}
                    ></div>
                  </div>
               </div>

               <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><BookOpen size={12} className="text-primary"/> Familiarisation</label>
                    <span className="text-xs font-bold">{famPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${getProgressColor(famPercent)}`} 
                      style={{ width: `${famPercent}%` }}
                    ></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DetailCard icon={<User size={18}/>} title="Identity & Core">
          <DataRow label="Full Name" value={identity.cadet_name}/>
          <DataRow label="Email" value={identity.cadet_email}/>
          <DataRow label="Date of Birth" value={identity.date_of_birth}/>
          <DataRow label="Nationality" value={identity.nationality}/>
          <DataRow label="Gender" value={identity.gender}/>
          <DataRow label="Blood Group" value={identity.blood_group}/>
        </DetailCard>

        <DetailCard icon={<MapPin size={18}/>} title="Contact & Address">
          <DataRow label="Mobile Phone" value={identity.phone_number}/>
          <DataRow label="Address" value={identity.address_line_1}/>
          <DataRow label="City / State" value={`${identity.city || '—'} / ${identity.state || '—'}`}/>
          <DataRow label="Country" value={identity.country}/>
          <DataRow label="Postal Code" value={identity.postal_code}/>
        </DetailCard>

        <DetailCard icon={<IdCard size={18}/>} title="Passport & Documents">
          <DataRow label="Passport No" value={identity.passport_number}/>
          <DataRow label="Passport Expiry" value={identity.passport_expiry_date}/>
          <DataRow label="Seaman Book No" value={identity.seaman_book_number}/>
          <DataRow label="INDOS No" value={identity.indos_number}/>
          <DataRow label="SID No" value={identity.sid_number}/>
        </DetailCard>

        <DetailCard icon={<ShieldCheck size={18}/>} title="Emergency Contact">
          <DataRow label="Name" value={identity.emergency_contact_name}/>
          <DataRow label="Relation" value={identity.emergency_contact_relation}/>
          <DataRow label="Phone" value={identity.emergency_contact_phone}/>
        </DetailCard>

        <DetailCard icon={<GraduationCap size={18}/>} title="Classification & System">
          <div className="grid grid-cols-2 gap-4">
            <DataRow label="Trainee Type" value={identity.trainee_type?.replace('_', ' ')}/>
            <DataRow label="Rank Label" value={identity.rank_label}/>
            <DataRow label="Category" value={identity.category}/>
            <DataRow label="TRB Status" value={identity.trb_applicable ? "Applicable" : "Not Applicable"}/>
            <DataRow label="System Role" value={identity.role_name}/>
          </div>
        </DetailCard>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-100 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border w-full max-w-5xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-muted/10">
              <h2 className="text-xl font-bold flex items-center gap-2"><Edit3 size={20} className="text-primary"/> Edit Trainee Data</h2>
              <button onClick={() => setEditModalOpen(false)}><X/></button>
            </div>
            <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
               <SectionHeader title="Identity & Personal"/>
               <InputGroup label="Full Name"><input value={editForm.cadet_name || ""} onChange={e => setEditForm({...editForm, cadet_name: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Email"><input value={editForm.cadet_email || ""} onChange={e => setEditForm({...editForm, cadet_email: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Gender"><select value={editForm.gender || ""} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="input-style"><option value="">Select</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></InputGroup>
               <InputGroup label="Date of Birth"><input type="date" value={editForm.date_of_birth || ""} onChange={e => setEditForm({...editForm, date_of_birth: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Nationality"><input value={editForm.nationality || ""} onChange={e => setEditForm({...editForm, nationality: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Blood Group"><select value={editForm.blood_group || ""} onChange={e => setEditForm({...editForm, blood_group: e.target.value})} className="input-style"><option value="">Select</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option></select></InputGroup>

               <SectionHeader title="Contact & Address"/>
               <InputGroup label="Mobile Phone"><input value={editForm.phone_number || ""} onChange={e => setEditForm({...editForm, phone_number: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Alt Phone"><input value={editForm.alternate_phone || ""} onChange={e => setEditForm({...editForm, alternate_phone: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Postal Code"><input value={editForm.postal_code || ""} onChange={e => setEditForm({...editForm, postal_code: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Address Line 1" className="md:col-span-3"><input value={editForm.address_line_1 || ""} onChange={e => setEditForm({...editForm, address_line_1: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Country"><select value={editForm.country || ""} onChange={e => setEditForm({...editForm, country: e.target.value, state: "", city: ""})} className="input-style"><option value="">Select Country</option>{Country.getAllCountries().map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}</select></InputGroup>
               <InputGroup label="State"><select value={editForm.state || ""} onChange={e => setEditForm({...editForm, state: e.target.value, city: ""})} className="input-style"><option value="">Select State</option>{editForm.country && State.getStatesOfCountry(editForm.country).map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}</select></InputGroup>
               <InputGroup label="City"><select value={editForm.city || ""} onChange={e => setEditForm({...editForm, city: e.target.value})} className="input-style"><option value="">Select City</option>{editForm.country && editForm.state && City.getCitiesOfState(editForm.country, editForm.state).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></InputGroup>

               <SectionHeader title="Passport & Documents"/>
               <InputGroup label="Passport Number"><input value={editForm.passport_number || ""} onChange={e => setEditForm({...editForm, passport_number: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Passport Country"><select value={editForm.passport_country || ""} onChange={e => setEditForm({...editForm, passport_country: e.target.value})} className="input-style"><option value="">Select</option>{Country.getAllCountries().map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}</select></InputGroup>
               <InputGroup label="Passport Expiry"><input type="date" value={editForm.passport_expiry_date || ""} onChange={e => setEditForm({...editForm, passport_expiry_date: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Seaman Book No"><input value={editForm.seaman_book_number || ""} onChange={e => setEditForm({...editForm, seaman_book_number: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Seaman Book Country"><select value={editForm.seaman_book_country || ""} onChange={e => setEditForm({...editForm, seaman_book_country: e.target.value})} className="input-style"><option value="">Select</option>{Country.getAllCountries().map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}</select></InputGroup>
               <InputGroup label="INDOS Number"><input value={editForm.indos_number || ""} onChange={e => setEditForm({...editForm, indos_number: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="SID Number"><input value={editForm.sid_number || ""} onChange={e => setEditForm({...editForm, sid_number: e.target.value})} className="input-style"/></InputGroup>

               <SectionHeader title="Emergency & Classification"/>
               <InputGroup label="Emergency Contact Name"><input value={editForm.emergency_contact_name || ""} onChange={e => setEditForm({...editForm, emergency_contact_name: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Relation"><input value={editForm.emergency_contact_relation || ""} onChange={e => setEditForm({...editForm, emergency_contact_relation: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Emergency Phone"><input value={editForm.emergency_contact_phone || ""} onChange={e => setEditForm({...editForm, emergency_contact_phone: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Trainee Type">
                  <select value={editForm.trainee_type || ""} onChange={e => setEditForm({...editForm, trainee_type: e.target.value})} className="input-style">
                    <option value="">Select</option>
                    <option value="DECK_CADET">Deck Cadet</option>
                    <option value="ENGINE_CADET">Engine Cadet</option>
                    <option value="ETO_CADET">ETO Cadet</option>
                    <option value="DECK_RATING">Deck Rating</option>
                    <option value="ENGINE_RATING">Engine Rating</option>
                  </select>
               </InputGroup>
               <InputGroup label="Rank Label"><input value={editForm.rank_label || ""} onChange={e => setEditForm({...editForm, rank_label: e.target.value})} className="input-style"/></InputGroup>
               <InputGroup label="Category"><input value={editForm.category || ""} onChange={e => setEditForm({...editForm, category: e.target.value})} className="input-style"/></InputGroup>
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
              <button onClick={() => setEditModalOpen(false)} className="px-8 py-2.5 border rounded-xl font-bold hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold hover:opacity-90 shadow-lg flex items-center gap-2 transition-all"><Save size={18}/> Update Command Center</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.input-style { width: 100%; background: hsl(var(--background)); border: 1px solid hsl(var(--border)); border-radius: 0.5rem; padding: 0.6rem 0.8rem; font-size: 0.875rem; font-weight: 600; outline: none; transition: border-color 0.2s; } .input-style:focus { border-color: hsl(var(--primary)); }`}</style>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="md:col-span-3 font-black text-[11px] uppercase text-primary/80 border-b border-primary/10 pb-1.5 mb-2 mt-4 tracking-wider">{title}</h3>;
}

function DetailCard({ icon, title, children }: any) {
  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col h-full hover:border-primary/30 transition-colors">
      <div className="px-4 py-3 bg-muted/20 border-b flex items-center gap-2 font-black text-[10px] uppercase text-muted-foreground tracking-widest border-primary/5">
        <span className="text-primary">{icon}</span> {title}
      </div>
      <div className="p-6 space-y-5 grow">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: any) {
  return (
    <div className="group">
      <p className="text-[10px] uppercase text-muted-foreground font-black tracking-widest leading-none mb-1.5 opacity-70">{label}</p>
      <p className="text-sm font-bold text-foreground truncate">{value || "—"}</p>
    </div>
  );
}

function InputGroup({ label, children, className = "" }: any) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none ml-0.5">{label}</label>
      {children}
    </div>
  );
}