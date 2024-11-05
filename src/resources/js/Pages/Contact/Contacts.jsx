import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ContactPreview from './Partials/ContactPreview';
import PrimaryButton from '@/Components/PrimaryButton';
import CreateContact from './Partials/CreateContact';

export default function Contacts({ auth }) {
    const [contacts, setContacts] = useState([]);
    const [contactAdded, setContactAdded] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const response = await axios.get(route('contact.contacts'));
                setContacts(response.data);
            } catch (error) {
                console.error('Error fetching contacts:', error);
            }
        })()
    }, [contactAdded]);

    const handleDelete = (contactId) => {
        setContacts((prevContacts) => prevContacts.filter(contact => contact.id !== contactId));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Contacts"
        >
            <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg h-full">
                <div className="flex justify-end">
                    <PrimaryButton onClick={() => setShowModal(true)}>Add Contact</PrimaryButton>
                </div>

                <CreateContact
                    showModal={showModal}
                    setShowModal={setShowModal}
                    onAdded={setContactAdded}
                />

                <div className="flex flex-col gap-4">
                    {contacts.length > 0 ? (
                        contacts.map(contact => (
                            <ContactPreview
                                key={contact.id}
                                contact={contact}
                                onDelete={handleDelete} />
                        ))
                    ) : (
                        <h3 className="text-left">No contacts</h3>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
