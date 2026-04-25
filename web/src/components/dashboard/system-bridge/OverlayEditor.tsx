import { motion } from 'framer-motion'
import {
  ChevronLeft,
  MonitorPlay,
  Palette,
  Settings2,
  Volume2,
  ShieldAlert,
  Activity,
  Play,
  Trash2,
  UploadCloud,
  Frown,
  Coins,
  CreditCard,
  UserRoundX,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useForm } from '@tanstack/react-form'
import { OVERLAY_TYPES } from './constants'
import { TabBtn, InputField, ToggleField } from './UI'
import { Simulator } from './Simulator'
import { UploadButton } from '../../../lib/uploadthing-client'
import {
  getOverlayConfigServerFn,
  saveOverlayConfigServerFn,
  saveVotingServerFn,
  uploadToBucketServerFn,
} from '../../../lib/overlay-utils'

export const OverlayEditor = ({
  type,
  onBack,
  user,
}: {
  type: string
  onBack: () => void
  user: any
}) => {
  const [activeSubTab, setActiveSubTab] = useState('appearance')
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [showSimulator, setShowSimulator] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [simulatorKey, setSimulatorKey] = useState(0)
  const [testingAlert, setTestingAlert] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nodeRef = useRef(null)

  useEffect(() => {
    if (type === 'SOUNDBOARD') {
      setActiveSubTab('media')
    } else {
      setActiveSubTab('appearance')
    }
  }, [type])

  const form = useForm({
    defaultValues: {
      isEnabled: true,
      backgroundColor: '#00000000',
      textColor: '#ffffff',
      highlightColor: '#00f3ff',
      minAmount: 1,
      minTtsAmount: 5,
      minMediaAmount: 10,
      duration: 5000,
      ttsEnabled: true,
      ttsVoice: 'id-ID-Standard-A',
      mediaEnabled: true,
      blockedKeywords: '',
      sounds: [] as { name: string; url: string; minAmount: number }[],
      profanityEnabled: true,
      gamblingEnabled: true,
      pinjolEnabled: true,
      saraEnabled: true,
      initialHours: 1,
      initialMinutes: 0,
      initialSeconds: 0,
      rules: [] as any[],
      fontSize: '64px',
      fontWeight: '900',
      showBorder: true,
      hideAmount: false,
      title: 'Leaderboard',
      target: 1000,
      options: ['', ''],
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      fontTitle: '900',
      fontContent: '700',
      timeRange: 'ALL',
      speed: 10,
      extraText: 'Terima kasih atas dukungannya!',
    },
    onSubmit: async ({ value }) => {
      setSaveStatus('SAVING...')
      try {
        const { isEnabled, ...config } = value

        // Save to overlayConfigs
        await saveOverlayConfigServerFn({
          data: {
            type,
            config,
            isEnabled,
          },
        })

        // Special handling for VOTING to ensure it's specifics are tracked
        if (type === 'VOTING') {
          const { startDate, startTime, endDate, endTime, title, options } =
            config
          await saveVotingServerFn({
            data: { startDate, startTime, endDate, endTime, title, options },
          })
        }

        setSaveStatus('SUCCESS!')
        setTimeout(() => setSaveStatus(null), 2000)
      } catch (err) {
        console.error('Save failed:', err)
        setSaveStatus('ERROR')
      }
    },
  })

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true)
      try {
        const res = await (getOverlayConfigServerFn as any)({ data: { type } })
        if (res) {
          form.setFieldValue('isEnabled', res.isEnabled ?? true)
        }
        if (res?.config) {
          Object.keys(res.config).forEach((key) => {
            form.setFieldValue(key as any, res.config[key])
          })
        }
      } catch (err) {
        console.error('Load config failed:', err)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [type])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await (uploadToBucketServerFn as any)({
        data: formData,
      })

      const newSound = {
        name: file.name.split('.')[0],
        url: res.url,
        minAmount: 10,
      }
      const currentSounds = form.getFieldValue('sounds') || []
      form.setFieldValue('sounds', [...currentSounds, newSound])
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Gagal mengupload file ke storage. Silakan coba lagi.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveSound = (idx: number) => {
    const current = form.getFieldValue('sounds')
    form.setFieldValue(
      'sounds',
      current.filter((_: any, i: number) => i !== idx),
    )
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
        Synchronizing_Protocol...
      </div>
    )
  }

  const overlayInfo = OVERLAY_TYPES.find((o) => o.id === type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-white/5 hover:bg-neon-pink/20 border border-white/10 text-neutral-400 hover:text-neon-pink transition-all skew-x--10"
          >
            <ChevronLeft size={20} className="skew-x-10" />
          </button>
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              Config:{' '}
              <span className={overlayInfo?.color}>{overlayInfo?.label}</span>
            </h2>
            <p className="text-[8px] text-neutral-500 uppercase font-black tracking-[0.3em] mt-1">
              {type}_INTERFACE_ACTIVE
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSimulator(!showSimulator)}
          className={`px-6 py-3 border transition-all uppercase text-[10px] font-black tracking-[0.2em] flex items-center gap-2 skew-x--10 ${
            showSimulator
              ? 'bg-neon-pink text-black border-neon-pink shadow-[0_0_20px_rgba(255,0,110,0.3)]'
              : 'bg-white/5 border-white/10 text-white hover:border-neon-cyan/50'
          }`}
        >
          <MonitorPlay size={14} className="skew-x-10" />
          <span className="skew-x-10">
            {showSimulator ? 'Close_Simulator' : 'Launch_Simulator'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex gap-2 border-b border-white/5 pb-4">
            {(type === 'ALERT' ||
              type === 'SUBATHON' ||
              type === 'SOUNDBOARD' ||
              type === 'MILESTONE' ||
              type === 'LEADERBOARD' ||
              type === 'VOTING' ||
              type === 'RUNNING_TEXT' ||
              type === 'QR_CODE' ||
              type === 'WHEEL') && (
              <TabBtn
                active={activeSubTab === 'appearance'}
                onClick={() => setActiveSubTab('appearance')}
                icon={<Palette size={14} />}
                label="Tampilan"
              />
            )}
            <TabBtn
              active={activeSubTab === 'logic'}
              onClick={() => setActiveSubTab('logic')}
              icon={<Settings2 size={14} />}
              label="Aturan"
            />
            {(type === 'ALERT' || type === 'SOUNDBOARD') && (
              <TabBtn
                active={activeSubTab === 'media'}
                onClick={() => setActiveSubTab('media')}
                icon={<Volume2 size={14} />}
                label="Media & TTS"
              />
            )}
            {type === 'ALERT' && (
              <TabBtn
                active={activeSubTab === 'shield'}
                onClick={() => setActiveSubTab('shield')}
                icon={<ShieldAlert size={14} />}
                label="AI Shield"
              />
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="p-8 bg-white/2 border border-white/5 space-y-8 skew-x--2"
          >
            <div className="skew-x-2 space-y-8">
              <div className="mb-8 border-b border-white/5 pb-8 flex items-center justify-between">
                <ToggleField
                  label="Aktifkan Overlay Protocol"
                  name="isEnabled"
                  form={form}
                  icon={<Activity size={14} className="text-neon-cyan" />}
                />

                {(type === 'ALERT' || type === 'SOUNDBOARD') && (
                  <button
                    type="button"
                    onClick={async () => {
                      setTestingAlert(true)
                      try {
                        await fetch('/api/donation/test', { method: 'POST' })
                      } catch (e) {
                        console.error('Test alert failed:', e)
                      } finally {
                        setTimeout(() => setTestingAlert(false), 2000)
                      }
                    }}
                    disabled={testingAlert}
                    className="px-4 py-2 bg-white/5 border border-white/10 hover:border-neon-cyan/50 text-neon-cyan text-[10px] font-black uppercase tracking-widest skew-x--10 flex items-center gap-2 transition-all"
                  >
                    <div className="skew-x-10 flex items-center gap-2">
                      <Play size={12} />
                      {testingAlert ? 'Processing...' : 'Trigger Test Alert'}
                    </div>
                  </button>
                )}
              </div>

              {type === 'SUBATHON' && activeSubTab === 'appearance' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                      label="Jam Awal"
                      name="initialHours"
                      form={form}
                      type="number"
                    />
                    <InputField
                      label="Menit Awal"
                      name="initialMinutes"
                      form={form}
                      type="number"
                    />
                    <InputField
                      label="Detik Awal"
                      name="initialSeconds"
                      form={form}
                      type="number"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-neon-cyan tracking-widest">
                        Gaya Teks
                      </h3>
                      <InputField
                        label="Warna Teks"
                        name="textColor"
                        form={form}
                        type="color"
                      />
                      <InputField
                        label="Ukuran Font (px)"
                        name="fontSize"
                        form={form}
                        type="text"
                      />
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                          Ketebalan Font
                        </label>
                        <form.Field
                          name="fontWeight"
                          children={(field: any) => (
                            <select
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              className="w-full bg-black border border-white/10 p-3 font-mono text-xs text-white focus:border-neon-cyan"
                            >
                              <option value="400">Regular</option>
                              <option value="700">Bold</option>
                              <option value="900">Black</option>
                            </select>
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-neon-cyan tracking-widest">
                        Background
                      </h3>
                      <InputField
                        label="Warna Background"
                        name="backgroundColor"
                        form={form}
                        type="color"
                      />
                      <ToggleField
                        label="Tampilkan Border"
                        name="showBorder"
                        form={form}
                        icon={<Activity size={14} />}
                      />
                    </div>
                  </div>
                </div>
              )}

              {type === 'SUBATHON' && activeSubTab === 'logic' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase text-neon-cyan tracking-widest">
                      Aturan Pertambahan Waktu
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const currentRules = form.getFieldValue('rules') || []
                        form.setFieldValue('rules', [
                          ...currentRules,
                          { amount: 1000, hours: 0, minutes: 1, seconds: 0 },
                        ])
                      }}
                      className="px-4 py-1.5 bg-neon-cyan text-black text-[9px] font-black uppercase tracking-widest skew-x--10"
                    >
                      Tambah Aturan
                    </button>
                  </div>

                  <div className="space-y-4">
                    <form.Field
                      name="rules"
                      children={(field: any) => (
                        <div className="space-y-4">
                          {(field.state.value || []).map(
                            (rule: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-4 bg-white/5 border border-white/10 flex flex-wrap items-center gap-4 skew-x--5"
                              >
                                <div className="skew-x-5 flex-1 min-w-30">
                                  <label className="text-[8px] font-black text-neutral-500 uppercase">
                                    Min Donasi
                                  </label>
                                  <input
                                    type="number"
                                    value={rule.amount}
                                    onChange={(e) => {
                                      const newRules = [...field.state.value]
                                      newRules[idx].amount = Number(
                                        e.target.value,
                                      )
                                      field.handleChange(newRules)
                                    }}
                                    className="w-full bg-transparent border-b border-white/10 text-xs font-mono p-1"
                                  />
                                </div>
                                <div className="skew-x-5 w-16">
                                  <label className="text-[8px] font-black text-neutral-500 uppercase">
                                    Jam
                                  </label>
                                  <input
                                    type="number"
                                    value={rule.hours}
                                    onChange={(e) => {
                                      const newRules = [...field.state.value]
                                      newRules[idx].hours = Number(
                                        e.target.value,
                                      )
                                      field.handleChange(newRules)
                                    }}
                                    className="w-full bg-transparent border-b border-white/10 text-xs font-mono p-1"
                                  />
                                </div>
                                <div className="skew-x-5 w-16">
                                  <label className="text-[8px] font-black text-neutral-500 uppercase">
                                    Min
                                  </label>
                                  <input
                                    type="number"
                                    value={rule.minutes}
                                    onChange={(e) => {
                                      const newRules = [...field.state.value]
                                      newRules[idx].minutes = Number(
                                        e.target.value,
                                      )
                                      field.handleChange(newRules)
                                    }}
                                    className="w-full bg-transparent border-b border-white/10 text-xs font-mono p-1"
                                  />
                                </div>
                                <div className="skew-x-5 w-16">
                                  <label className="text-[8px] font-black text-neutral-500 uppercase">
                                    Det
                                  </label>
                                  <input
                                    type="number"
                                    value={rule.seconds}
                                    onChange={(e) => {
                                      const newRules = [...field.state.value]
                                      newRules[idx].seconds = Number(
                                        e.target.value,
                                      )
                                      field.handleChange(newRules)
                                    }}
                                    className="w-full bg-transparent border-b border-white/10 text-xs font-mono p-1"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newRules = field.state.value.filter(
                                      (_: any, i: number) => i !== idx,
                                    )
                                    field.handleChange(newRules)
                                  }}
                                  className="text-neon-pink hover:text-white transition-colors skew-x-5"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* APPEARANCE: SOUNDBOARD / MILESTONE / LEADERBOARD / VOTING */}
              {(type === 'SOUNDBOARD' ||
                type === 'MILESTONE' ||
                type === 'LEADERBOARD' ||
                type === 'VOTING' ||
                type === 'RUNNING_TEXT') &&
                activeSubTab === 'appearance' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-neon-cyan tracking-widest">
                        Visual Style
                      </h3>
                      {type === 'RUNNING_TEXT' && (
                        <>
                          <InputField
                            label="Teks Tambahan"
                            name="extraText"
                            form={form}
                            type="text"
                          />
                          <InputField
                            label="Kecepatan (detik)"
                            name="speed"
                            form={form}
                            type="number"
                          />
                        </>
                      )}
                      {(type === 'VOTING' || type === 'LEADERBOARD') && (
                        <InputField
                          label={
                            type === 'VOTING' ? 'Judul Voting' : 'Judul Leaderboard'
                          }
                          name="title"
                          form={form}
                          type="text"
                        />
                      )}
                      <InputField
                        label="Warna Teks"
                        name="textColor"
                        form={form}
                        type="color"
                      />
                      {(type === 'VOTING' || type === 'LEADERBOARD' || type === 'RUNNING_TEXT') && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                            Ketebalan Teks
                          </label>
                          <form.Field
                            name={type === 'RUNNING_TEXT' ? 'fontWeight' : 'fontContent'}
                            children={(field: any) => (
                              <select
                                value={field.state.value}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                className="w-full bg-black border border-white/10 p-3 font-mono text-xs text-white focus:border-neon-cyan"
                              >
                                <option value="400">Regular</option>
                                <option value="700">Bold</option>
                                <option value="900">Black</option>
                              </select>
                            )}
                          />
                        </div>
                      )}
                      <InputField
                        label="Warna Highlight"
                        name="highlightColor"
                        form={form}
                        type="color"
                      />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-neon-cyan tracking-widest">
                        Background & Border
                      </h3>
                      <InputField
                        label="Warna Background"
                        name="backgroundColor"
                        form={form}
                        type="color"
                      />
                      <ToggleField
                        label={
                          type === 'VOTING' || type === 'LEADERBOARD' || type === 'RUNNING_TEXT'
                            ? 'Tanpa Border'
                            : 'Tampilkan Border'
                        }
                        name="showBorder"
                        form={form}
                        icon={<Activity size={14} />}
                      />
                      {(type === 'LEADERBOARD' || type === 'RUNNING_TEXT') && (
                        <ToggleField
                          label="Tanpa Jumlah Uang"
                          name="hideAmount"
                          form={form}
                          icon={<Activity size={14} />}
                        />
                      )}
                    </div>
                  </div>
                )}

              {/* LOGIC: LEADERBOARD SPECIFIC */}
              {type === 'LEADERBOARD' && activeSubTab === 'logic' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-white tracking-widest">
                        Rentang Waktu Leaderboard
                      </h3>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                          Pilih Rentang
                        </label>
                        <form.Field
                          name="timeRange"
                          children={(field: any) => (
                            <select
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              className="w-full bg-black border border-white/10 p-3 font-mono text-xs text-white focus:border-neon-cyan"
                            >
                              <option value="ALL">Semua Waktu</option>
                              <option value="WEEKLY">Mingguan</option>
                              <option value="MONTHLY">Bulanan</option>
                              <option value="YEARLY">Tahunan</option>
                              <option value="CUSTOM">Custom Range</option>
                            </select>
                          )}
                        />
                      </div>
                    </div>
                    
                    <form.Field name="timeRange">
                      {(field: any) => field.state.value === 'CUSTOM' && (
                        <div className="space-y-4">
                          <h3 className="text-[10px] font-black uppercase text-white tracking-widest">
                            Mulai Tanggal (Hingga Hari Ini)
                          </h3>
                          <InputField
                            label="Mulai Tanggal"
                            name="startDate"
                            form={form}
                            type="date"
                          />
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>
              )}

              {/* LOGIC: VOTING SPECIFIC */}
              {type === 'VOTING' && activeSubTab === 'logic' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-white tracking-widest">
                        Informasi Voting
                      </h3>
                      <InputField
                        label="Judul Voting"
                        name="title"
                        form={form}
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase text-white tracking-widest">
                        Pilihan Vote (Min 2, Max 5)
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          const current = form.getFieldValue('options') || []
                          if (current.length < 5)
                            form.setFieldValue('options', [...current, ''])
                        }}
                        className="px-4 py-1.5 bg-neon-cyan text-black text-[9px] font-black uppercase tracking-widest skew-x--10 disabled:opacity-50"
                        disabled={
                          (form.getFieldValue('options') || []).length >= 5
                        }
                      >
                        Tambah Pilihan
                      </button>
                    </div>
                    <form.Field
                      name="options"
                      children={(field: any) => (
                        <div className="space-y-3">
                          {(field.state.value || []).map(
                            (opt: string, idx: number) => (
                              <div
                                key={idx}
                                className="flex gap-2 items-center"
                              >
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOpts = [...field.state.value]
                                    newOpts[idx] = e.target.value
                                    field.handleChange(newOpts)
                                  }}
                                  placeholder={`Pilihan ${idx + 1}`}
                                  className="flex-1 bg-black border border-white/10 p-3 font-mono text-xs text-white focus:border-neon-cyan"
                                />
                                {field.state.value.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOpts = field.state.value.filter(
                                        (_: any, i: number) => i !== idx,
                                      )
                                      field.handleChange(newOpts)
                                    }}
                                    className="p-3 text-neon-pink"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-white tracking-widest">
                        Jadwal Mulai
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField
                          label="Tanggal Mulai"
                          name="startDate"
                          form={form}
                          type="date"
                        />
                        <InputField
                          label="Waktu Mulai"
                          name="startTime"
                          form={form}
                          type="time"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-white tracking-widest">
                        Jadwal Selesai
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField
                          label="Tanggal Selesai"
                          name="endDate"
                          form={form}
                          type="date"
                        />
                        <InputField
                          label="Waktu Selesai"
                          name="endTime"
                          form={form}
                          type="time"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LOGIC: MILESTONE SPECIFIC */}
              {type === 'MILESTONE' && activeSubTab === 'logic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-white tracking-widest">
                      Goal Settings
                    </h3>
                    <InputField
                      label="Judul Target"
                      name="title"
                      form={form}
                      type="text"
                    />
                    <InputField
                      label="Jumlah Target (MON)"
                      name="target"
                      form={form}
                      type="number"
                    />
                  </div>
                </div>
              )}

              {type === 'ALERT' && activeSubTab === 'appearance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-neon-cyan tracking-widest">
                      Visual Style
                    </h3>
                    <InputField
                      label="Warna Background (OBS)"
                      name="backgroundColor"
                      form={form}
                      type="color"
                    />
                    <InputField
                      label="Warna Teks Utama"
                      name="textColor"
                      form={form}
                      type="color"
                    />
                    <InputField
                      label="Warna Highlight"
                      name="highlightColor"
                      form={form}
                      type="color"
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-neon-cyan tracking-widest">
                      Timing
                    </h3>
                    <InputField
                      label="Durasi Alert (ms)"
                      name="duration"
                      form={form}
                      type="number"
                    />
                  </div>
                </div>
              )}

              {activeSubTab === 'logic' &&
                (type === 'ALERT' || type === 'SOUNDBOARD') && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase text-white tracking-widest">
                          Thresholds
                        </h3>
                        <InputField
                          label="Min. Donasi Alert"
                          name="minAmount"
                          form={form}
                          type="number"
                        />
                        <InputField
                          label="Min. Donasi TTS"
                          name="minTtsAmount"
                          form={form}
                          type="number"
                        />
                        <InputField
                          label="Min. Donasi Media"
                          name="minMediaAmount"
                          form={form}
                          type="number"
                        />
                      </div>
                    </div>
                  </div>
                )}

              {activeSubTab === 'media' &&
                (type === 'ALERT' || type === 'SOUNDBOARD') && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase text-white tracking-widest">
                          Text To Speech (TTS)
                        </h3>
                        <ToggleField
                          label="Aktifkan TTS"
                          name="ttsEnabled"
                          form={form}
                          icon={<Volume2 size={14} />}
                        />
                      </div>
                    </div>

                    {/* MEDIA SECTION */}
                    <div className="pt-8 border-t border-white/5 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-[10px] font-black uppercase text-neon-cyan tracking-[0.3em]">
                            {type === 'SOUNDBOARD'
                              ? 'Library_Soundboard'
                              : 'Alert_Media'}
                          </h3>
                          <p className="text-[8px] text-neutral-600 uppercase italic">
                            Media audio kustom di decentralized storage.
                          </p>
                        </div>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="audio/*"
                          className="hidden"
                        />

                        <UploadButton
                          endpoint="audioUploader"
                          onClientUploadComplete={(res) => {
                            if (res?.[0]) {
                              const newSound = {
                                name: res[0].name.split('.')[0],
                                url: res[0].url,
                                minAmount: 10,
                              }
                              const currentSounds = form.getFieldValue('sounds') || []
                              form.setFieldValue('sounds', [...currentSounds, newSound])
                              
                              // Trigger auto-save to database
                              setTimeout(() => {
                                form.handleSubmit()
                              }, 100)
                            }
                          }}
                          onUploadError={(error: Error) => {
                            alert(`ERROR! ${error.message}`);
                          }}
                          className="ut-button:bg-neon-cyan ut-button:text-black ut-button:text-[9px] ut-button:font-black ut-button:uppercase ut-button:tracking-widest ut-button:skew-x--10 ut-button:rounded-none ut-button:px-6 ut-button:py-3 ut-allowed-content:hidden"
                        />
                      </div>

                      <form.Field name="sounds">
                        {(field: any) => (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(field.state.value || []).map(
                              (sound: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-4 bg-white/2 border border-white/5 flex items-center justify-between group hover:border-neon-cyan/30 transition-all skew-x--3"
                                >
                                  <div className="flex items-center gap-6 skew-x-3 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const audio = new Audio(sound.url)
                                        audio.play().catch((err) => {
                                          console.error(
                                            'Audio play error:',
                                            err,
                                          )
                                          alert('Gagal memutar suara.')
                                        })
                                      }}
                                      className="w-12 h-12 bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all shrink-0 shadow-[0_0_15px_rgba(0,243,255,0.1)]"
                                    >
                                      <Play size={20} />
                                    </button>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[12px] font-black text-white uppercase italic truncate pr-4">
                                        {sound.name}
                                      </p>
                                      <p className="text-[8px] text-neutral-600 uppercase tracking-tighter truncate opacity-40">
                                        Asset_Verified_v1.2
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 skew-x-3 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSound(index)}
                                      className="p-3 text-neutral-600 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </form.Field>
                    </div>
                  </div>
                )}

              {activeSubTab === 'shield' && type === 'ALERT' && (
                <div className="space-y-8">
                  <div className="p-4 bg-neon-cyan/5 border border-neon-cyan/20 flex items-center gap-4 skew-x--5">
                    <ShieldAlert
                      size={24}
                      className="text-neon-cyan skew-x-5"
                    />
                    <div className="skew-x-5">
                      <h4 className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">
                        AI Shield Protocol: ACTIVE
                      </h4>
                      <p className="text-[8px] text-neutral-400 uppercase italic">
                        Deteksi otomatis Llama 3.3
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleField
                      label="Filter Kata Kasar"
                      name="profanityEnabled"
                      form={form}
                      icon={<Frown size={14} />}
                    />
                    <ToggleField
                      label="Blokir Judi / Slot"
                      name="gamblingEnabled"
                      form={form}
                      icon={<Coins size={14} />}
                    />
                    <ToggleField
                      label="Blokir Pinjol Ilegal"
                      name="pinjolEnabled"
                      form={form}
                      icon={<CreditCard size={14} />}
                    />
                    <ToggleField
                      label="Blokir SARA / Hate"
                      name="saraEnabled"
                      form={form}
                      icon={<UserRoundX size={14} />}
                    />
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-white/5 flex gap-4">
                <button
                  type="submit"
                  disabled={saveStatus !== null}
                  className="px-8 py-3 bg-neon-cyan text-black font-black uppercase tracking-widest hover:bg-white transition-all skew-x--10 flex items-center gap-2"
                >
                  <span className="skew-x-10">
                    {saveStatus || 'UPDATE_CONFIG'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-black border border-white/5 p-6 space-y-4">
            <h3 className="text-[10px] font-black uppercase text-neon-cyan tracking-widest">
              Widget Link
            </h3>
            <div className="bg-white/5 p-4 font-mono text-[10px] break-all border border-white/10 text-neutral-400">
              {`${window.location.origin}/widgets/${type}/${user?.address}`}
            </div>
            <button
              onClick={() => {
                const url = `${window.location.origin}/widgets/${type}/${user?.address}`
                navigator.clipboard.writeText(url)
                setSaveStatus('URL_COPIED')
                setTimeout(() => setSaveStatus(null), 2000)
              }}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Copy Widget URL
            </button>
            <div className="p-4 bg-neon-cyan/5 border border-l-4 border-neon-cyan/30 text-[9px] text-neutral-400 leading-relaxed uppercase italic">
              Panduan: Klik tombol Copy dan pastekan URL di atas pada "Browser
              Source" di OBS.
              <br />
              <br />
              <span className="text-neon-pink font-black">NEW:</span> Setelah
              merubah tampilan, double click pada browser source pada OBS dan
              tekan{' '}
              <span className="text-white">
                "Refresh cache of current page"
              </span>
              . Jika tidak tampil, pastikan OBS telah terupdate ke versi terbaru
              (v28+).
            </div>
          </div>
        </div>
      </div>

      {showSimulator && (
        <Simulator
          type={type}
          user={user}
          nodeRef={nodeRef}
          simulatorKey={simulatorKey}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          setSimulatorKey={setSimulatorKey}
          setShowSimulator={setShowSimulator}
        />
      )}
    </motion.div>
  )
}
