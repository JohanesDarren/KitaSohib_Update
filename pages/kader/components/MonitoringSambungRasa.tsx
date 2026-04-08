import React, { useEffect, useState } from "react";
import { api } from "../../../services/mockSupabase";
import { useAuth } from "../../../context/AuthContext";
import { AlertTriangle, MessageCircle, Brain } from "lucide-react";
import { UserProfile } from "../../../types";

interface EmotionTest {
  user_id: string;
  score: number;
  timestamp: string;
}

export default function MonitoringSambungRasa() {
  const { user } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [emotionTests, setEmotionTests] = useState<EmotionTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      const users = await api.getUsers();
      const tests = await api.getEmotionResults();

      const binaan = users.filter(
        (u: UserProfile) => u.assigned_kader_id === user.id
      );

      setStudents(binaan);
      setEmotionTests(tests);
      setLoading(false);
    }

    loadData();
  }, [user]);

  function getLatestTest(userId: string) {
    const tests = emotionTests.filter((t) => t.user_id === userId);
    return tests[tests.length - 1];
  }

  function getRisk(test?: EmotionTest) {
    if (!test)
      return {
        label: "Belum Ada",
        badge: "bg-gray-100 text-gray-600",
      };

    if (test.score > 70)
      return {
        label: "Risiko Tinggi",
        badge: "bg-red-100 text-red-600",
      };

    if (test.score > 40)
      return {
        label: "Sedang",
        badge: "bg-yellow-100 text-yellow-600",
      };

    return {
      label: "Rendah",
      badge: "bg-green-100 text-green-600",
    };
  }

  if (loading) {
    return <p className="text-gray-400">Memuat data sambung rasa...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Monitoring Sambung Rasa</h1>
        <p className="text-gray-500 text-sm">
          Pantau kondisi batin remaja binaan Anda
        </p>
      </div>

      {students.length === 0 && (
        <div className="text-gray-400">Belum ada remaja binaan</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {students.map((s) => {
          const test = getLatestTest(s.id);
          const risk = getRisk(test);

          return (
            <div
              key={s.id}
              className="bg-white rounded-2xl p-5 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold">{s.full_name}</h2>
                  <p className="text-xs text-gray-400">{s.school_name}</p>
                </div>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${risk.badge}`}
                >
                  {risk.label}
                </span>
              </div>

              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p>Skor Terakhir: {test?.score ?? "-"}</p>
                <p>
                  Tanggal Tes:{" "}
                  {test
                    ? new Date(test.timestamp).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex items-center gap-1 px-3 py-2 text-xs rounded-xl bg-blue-50 text-blue-600">
                  <MessageCircle size={14} /> Chat
                </button>

                <button className="flex items-center gap-1 px-3 py-2 text-xs rounded-xl bg-purple-50 text-purple-600">
                  <Brain size={14} /> Minta Tes
                </button>

                {risk.label === "Risiko Tinggi" && (
                  <button className="flex items-center gap-1 px-3 py-2 text-xs rounded-xl bg-red-50 text-red-600">
                    <AlertTriangle size={14} /> Rujuk
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
