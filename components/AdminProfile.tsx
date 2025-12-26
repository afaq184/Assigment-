import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Briefcase, 
  MapPin, 
  Phone, 
  Calendar, 
  Edit2, 
  Save, 
  X,
  Camera,
  ShieldCheck,
  Upload
} from 'lucide-react';
import { AdminProfile } from '../types';

interface AdminProfileProps {
  initialProfile: AdminProfile;
  onUpdate: (profile: AdminProfile) => void;
}

export const AdminProfileComponent: React.FC<AdminProfileProps> = ({ initialProfile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<AdminProfile>(initialProfile);
  const [formData, setFormData] = useState<AdminProfile>(initialProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with prop if it changes
  useEffect(() => {
    setProfile(initialProfile);
    setFormData(initialProfile);
  }, [initialProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setProfile(formData);
    onUpdate(formData);
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">Administrator Profile</h2>
           <p className="text-slate-500 text-sm">Manage your account settings and personal details.</p>
        </div>
        {!isEditing ? (
           <button 
             onClick={() => setIsEditing(true)}
             className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
           >
             <Edit2 size={16} />
             <span>Edit Profile</span>
           </button>
        ) : (
           <div className="flex space-x-3">
              <button 
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Save size={16} />
                <span>Save Changes</span>
              </button>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
              <div 
                className={`relative mb-4 group ${isEditing ? 'cursor-pointer' : ''}`}
                onClick={handleAvatarClick}
              >
                 <div className="w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center border-4 border-slate-100 shadow-inner overflow-hidden">
                    {isEditing ? (
                        formData.avatarUrl ? (
                            <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-bold text-white">{formData.name.charAt(0)}</span>
                        )
                    ) : (
                        profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-bold text-white">{profile.name.charAt(0)}</span>
                        )
                    )}
                 </div>
                 
                 {/* Hover Overlay for Edit Mode */}
                 {isEditing && (
                   <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white mb-1" size={24} />
                      <span className="text-white text-xs font-medium">Change Photo</span>
                   </div>
                 )}
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleFileChange} 
                   className="hidden" 
                   accept="image/*"
                 />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
              <p className="text-indigo-600 font-medium text-sm">{profile.role}</p>
              
              <div className="mt-4 flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                 <ShieldCheck size={12} className="mr-1" /> Verified Admin
              </div>

              <div className="w-full border-t border-slate-100 mt-6 pt-6 text-left space-y-3">
                 <div className="flex items-center text-sm text-slate-600">
                    <Calendar size={16} className="mr-3 text-slate-400" />
                    <span>Last Login: <span className="text-slate-900 font-medium">{profile.lastLogin}</span></span>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Details Form */}
        <div className="md:col-span-2">
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">Personal Information</h3>
                 {isEditing && <span className="text-xs text-indigo-600 font-medium">Editing enabled</span>}
              </div>
              <div className="p-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                       <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                             type="text" 
                             name="name"
                             disabled={!isEditing}
                             value={isEditing ? formData.name : profile.name}
                             onChange={handleInputChange}
                             className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isEditing ? 'border-indigo-300 bg-white ring-2 ring-indigo-50' : 'border-transparent bg-slate-50 text-slate-600'}`}
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Job Title / Role</label>
                       <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                             type="text" 
                             name="role"
                             disabled={!isEditing}
                             value={isEditing ? formData.role : profile.role}
                             onChange={handleInputChange}
                             className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isEditing ? 'border-indigo-300 bg-white ring-2 ring-indigo-50' : 'border-transparent bg-slate-50 text-slate-600'}`}
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                       <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                             type="email" 
                             name="email"
                             disabled={!isEditing}
                             value={isEditing ? formData.email : profile.email}
                             onChange={handleInputChange}
                             className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isEditing ? 'border-indigo-300 bg-white ring-2 ring-indigo-50' : 'border-transparent bg-slate-50 text-slate-600'}`}
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                       <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                             type="text" 
                             name="phone"
                             disabled={!isEditing}
                             value={isEditing ? formData.phone : profile.phone}
                             onChange={handleInputChange}
                             className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isEditing ? 'border-indigo-300 bg-white ring-2 ring-indigo-50' : 'border-transparent bg-slate-50 text-slate-600'}`}
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                       <input 
                          type="text" 
                          name="department"
                          disabled={!isEditing}
                          value={isEditing ? formData.department : profile.department}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isEditing ? 'border-indigo-300 bg-white ring-2 ring-indigo-50' : 'border-transparent bg-slate-50 text-slate-600'}`}
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Office Location</label>
                       <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                             type="text" 
                             name="location"
                             disabled={!isEditing}
                             value={isEditing ? formData.location : profile.location}
                             onChange={handleInputChange}
                             className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isEditing ? 'border-indigo-300 bg-white ring-2 ring-indigo-50' : 'border-transparent bg-slate-50 text-slate-600'}`}
                          />
                       </div>
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-slate-700 mb-1">Bio / Notes</label>
                       <textarea 
                          rows={4}
                          name="bio"
                          disabled={!isEditing}
                          value={isEditing ? formData.bio : profile.bio}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none ${isEditing ? 'border-indigo-300 bg-white ring-2 ring-indigo-50' : 'border-transparent bg-slate-50 text-slate-600'}`}
                       ></textarea>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};