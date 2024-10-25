<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ChatRoom;
use Inertia\Response as InertiaResponse;

final class MainController extends Controller
{
    public function index(?ChatRoom $chatRoom = null): InertiaResponse
    {
        return inertia('Main', compact('chatRoom'));
    }
}
