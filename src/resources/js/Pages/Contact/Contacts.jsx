import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, {useEffect, useState} from 'react';
import axios from 'axios';
import ContactPreview from './Partials/ContactPreview';
import PrimaryButton from '@/Components/PrimaryButton';
import CreateContact from './Partials/CreateContact';
import TextInput from '@/Components/TextInput';
import CustomScrollArea from "@/Components/CustomScrollArea.jsx";

export default function Contacts({auth}) {
    const [contacts, setContacts] = useState([]);
    const [contactAdded, setContactAdded] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [filterQuery, setFilterQuery] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const response = await axios.get(route('contact.contacts'));
                setContacts(response.data);
                setShowModal(false);
            } catch (error) {
                console.error('Error fetching contacts:', error);
            }
        })()
    }, [contactAdded]);

    const handleDelete = (contactId) => {
        setContacts((prevContacts) => prevContacts.filter(contact => contact.id !== contactId));
    };

    const filteredContacts = contacts.filter(contact =>
        contact.name.includes(filterQuery)
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Contacts"
        >
            <div className="bg-[#93C5FD] shadow h-full py-1 px-3">
                <div className={`flex flex-col bg-[#2889EE] rounded-[28px] p-3 lg:p-10 md:p-7 sm:p-3 gap-3 h-full`}>
                    <div className="my-2">
                        <TextInput
                            placeholder='Filter contacts'
                            className="w-full"
                            value={filterQuery}
                            onChange={e => setFilterQuery(e.target.value)}
                        />
                    </div>

                    <CreateContact
                        showModal={showModal}
                        setShowModal={setShowModal}
                        onAdded={setContactAdded}
                        auth={auth}
                    />

                    <CustomScrollArea
                        className="bg-white p-3 rounded-[5px] h-full"
                    >
                        {filteredContacts.length > 0 ? (
                            filteredContacts.map(contact => (
                                <div key={contact.id}>
                                    <ContactPreview
                                        contact={contact}
                                        onDelete={handleDelete}
                                    />
                                </div>
                            ))
                        ) : (
                            <h3 className="text-left">No contacts</h3>
                        )}
                    </CustomScrollArea>

                    <div className="flex justify-start mt-3">
                        <PrimaryButton
                            className="!bg-[#60A5FA] hover:!bg-blue-600 focus:!bg-blue-600 active:bg-gray-900"
                            onClick={() => setShowModal(true)}
                        >
                            Add Contact
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
