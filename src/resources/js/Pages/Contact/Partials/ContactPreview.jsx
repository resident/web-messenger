import Dropdown from '@/Components/Dropdown';
import {EllipsisVerticalIcon} from '@heroicons/react/24/solid';

const ContactPreview = ({contact, onDelete}) => {

    const handleDelete = async () => {
        try {
            await axios.delete(route('contact.delete'), {
                data: {contact_id: contact.id}
            });
            onDelete(contact.id);
        } catch (error) {
            console.error('Error deleting contact:', error);
        }
    };

    return (
        <div className="flex lg:w-1/4 md:w-2/4 sm:w-3/4 mt-3 justify-between cursor-pointer relative hover:bg-gray-100">
            <div className="flex items-center gap-2">
                {contact.avatar && <img
                    src={`${import.meta.env.VITE_AVATARS_STORAGE}/${contact.avatar.path}`}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover"
                /> || <div className={`size-10 rounded-full bg-lime-300`}></div>}

                <p className="text-lg font-medium">{contact.name}</p>
            </div>

            <Dropdown>
                <Dropdown.Trigger className="text-gray-500 hover:text-gray-700 focus:outline-none">
                    <EllipsisVerticalIcon className='w-7'/>
                </Dropdown.Trigger>
                <Dropdown.Content contentClasses="py-0">
                    <button
                        onClick={handleDelete}
                        className="w-full text-md text-gray-700 hover:bg-gray-100"
                    >
                        Delete
                    </button>
                </Dropdown.Content>
            </Dropdown>
        </div>
    );
};

export default ContactPreview;
