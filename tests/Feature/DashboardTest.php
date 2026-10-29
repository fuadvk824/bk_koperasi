
<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))
        ->assertRedirect(route('login'));
});

test('authenticated users with an allowed role can visit the dashboard', function () {
    app(\Spatie\Permission\PermissionRegistrar::class)
        ->forgetCachedPermissions();

    $permission = Permission::findOrCreate('view dashboard', 'web');
    $role = Role::findOrCreate('admin', 'web');

    $role->givePermissionTo($permission);

    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});
