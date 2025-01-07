import { useState } from "react";
import axios from "axios";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";

export default function OnlinePrivacyStatusForm({ userSettings, className = "" }) {
    const [statusVisibility, setStatusVisibility] = useState(
        userSettings?.status_visibility ?? "everyone"
    );
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSave = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            await axios.put(route("user-settings.update"), {
                status_visibility: statusVisibility,
            });
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-white">Online Privacy Status</h2>
                <p className="mt-1 text-sm text-white">
                    Choose who can see your online status.
                </p>
            </header>

            <div className="mt-4 space-y-4">
                <div>
                    <label className="flex items-center gap-2 text-white">
                        <input
                            type="radio"
                            name="status_visibility"
                            value="everyone"
                            checked={statusVisibility === "everyone"}
                            onChange={() => setStatusVisibility("everyone")}
                        />
                        <span className="font-semibold">Everyone</span>
                    </label>
                    <p className="text-sm text-white ml-6">
                        <em>Everyone will see your online status</em>
                    </p>
                </div>
                <div>
                    <label className="flex items-center gap-2 text-white">
                        <input
                            type="radio"
                            name="status_visibility"
                            value="contacts"
                            checked={statusVisibility === "contacts"}
                            onChange={() => setStatusVisibility("contacts")}
                        />
                        <span className="font-semibold">Contacts</span>
                    </label>
                    <p className="text-sm text-white ml-6">
                        <em>Only your contacts will see your online status</em>
                    </p>
                </div>
                <div>
                    <label className="flex items-center gap-2 text-white">
                        <input
                            type="radio"
                            name="status_visibility"
                            value="nobody"
                            checked={statusVisibility === "nobody"}
                            onChange={() => setStatusVisibility("nobody")}
                        />
                        <span className="font-semibold">Nobody</span>
                    </label>
                    <p className="text-sm text-white ml-6">
                        <em>No one will see your online status</em>
                    </p>
                </div>
            </div>

            {errors.status_visibility &&
                errors.status_visibility.map((msg, i) => (
                    <InputError key={i} message={msg} className="mt-2" />
                ))}

            <div className="mt-4">
                <PrimaryButton
                    className="!bg-blue-400 hover:!bg-blue-600"
                    disabled={processing}
                    onClick={handleSave}
                >
                    Save
                </PrimaryButton>
            </div>
        </section>
    );
}
