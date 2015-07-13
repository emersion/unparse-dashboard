Parse.serverURL = '/api';
Parse.initialize('519e32bde6ce6398dedd6217ed3aea09b086ab6d', '47a980ec12488c672775f64803c68f2e1cc77182');

// Parse lib fix: allow any permission name
var oldACL = Parse.ACL;
Parse.ACL = function (arg1) {
	if (arg1 && typeof arg1 == 'object' && !(arg1 instanceof Parse.User)) {
		oldACL.call(this);
		this.permissionsById = arg1;
	} else {
		oldACL.call(this, arg1);
	}
};
Parse.ACL.prototype = oldACL.prototype;

var Class = Parse.Object.extend('__Class');


var app = angular.module('unparse', ['ui.bootstrap']);

// Handle <template> elements as Angular templates
// For a better readability (no <script> hack!)
app.directive('template', ['$templateCache', function ($templateCache) {
	return {
		restrict: 'E',
		link: function(scope, element, attrs) {
			$templateCache.put(element.attr('id'), element.html());
			element.remove();
		}
	};
}]);

app.controller('MainCtrl', ['$scope', '$q', '$modal', function ($scope, $q, $modal) {
	$scope.currentUser = Parse.User.current();
	$scope.classesList = [];

	$scope.openClass = function (c) {
		$scope.openedClass = c;
	};

	$scope.loadClasses = function () {
		$scope.classesList = [];

		var query = new Parse.Query(Class);
		return $q.when(query.find()).then(function (classes) {
			console.log(classes);
			for (var i = 0; i < classes.length; i++) {
				$scope.classesList.push(classes[i]);
			}
		}, function (err) {
			$scope.showError(err);
		});
	};

	$scope.selectFirstClass = function () {
		return $scope.openClass($scope.classesList[0]);
	};

	$scope.loadData = function () {
		return $scope.loadClasses().then(function () {
			return $scope.selectFirstClass();
		});
	};

	$scope.addClass = function () {
		var modal = $modal.open({
			templateUrl: 'add-class-modal'
		});

		modal.result.then(function (data) {
			var c = new Class({
				name: data.name
			});
			return $q.when(c.save());
		}, function () {}).then(function (c) {
			if (!c) return;

			$scope.classesList.push(c);
		}, function (err) {
			$scope.showError(err);
		});
	};

	$scope.showError = function (msg) {
		if (msg && typeof msg == 'object') {
			msg = msg.message;
		}

		$scope.errorMessage = msg;
	};

	$scope.login = function () {
		if ($scope.currentUser) {
			return $scope.loadData();
		}

		var modal = $modal.open({
			templateUrl: 'login-modal',
			windowClass: 'login-modal'
		});

		modal.result.then(function (data) {
			var promise = Parse.User.logIn(data.username, data.password);
			return $q.when(promise);
		}, function () {}).then(function (user) {
			if (user) {
				$scope.currentUser = user;
			}

			return $scope.loadData();
		}, function (err) {
			$scope.showError(err);
		});
	};

	$scope.logout = function () {
		Parse.User.logOut();
		$scope.currentUser = null;

		return $scope.loadData();
	};

	$scope.login();
}])

app.controller('ClassesListCtrl', ['$scope', '$q', function ($scope, $q) {
	$scope.getClassIcon = function (className) {
		var icons = {
			'_User': 'user',
			'_Role': 'tower',
			'_Installation': 'phone'
		};
		return icons[className] || 'th-list';
	};
}]);

app.controller('OpenedClassCtrl', ['$scope', '$q', '$modal', function ($scope, $q, $modal) {
	$scope.activeRow = null;
	$scope.activeColumn = null;
	$scope.rowFilter = {};
	$scope.openedRows = [];

	$scope.$watch('openedClass', function (c) {
		if (!c) return;

		$scope.addingNewRow = false;
		$scope.activeRow = null;
		$scope.activeColumn = null;
		$scope.rowFilter = {};
		$scope.openedRows = [];

		$scope.loadRows();
	});

	$scope.loadRows = function () {
		var c = $scope.openedClass;
		var query = new Parse.Query(c.get('name'));

		for (var name in $scope.rowFilter) {
			var val = $scope.rowFilter[name];
			query.equalTo(name, val);
		}

		return $q.when(query.find()).then(function (rows) {
			$scope.openedRows = rows;
		}, function (err) {
			$scope.showError(err);
		});
	};

	$scope.selectRow = function (row) {
		$scope.activeRow = row;
	};

	$scope.selectColumn = function (column) {
		$scope.activeColumn = column;
	};

	$scope.addColumn = function () {
		var modal = $modal.open({
			templateUrl: 'add-column-modal'
		});

		modal.result.then(function (data) {
			var c = $scope.openedClass;

			var newColumn = {};
			newColumn[data.name] = { type: data.type };

			var attributes = angular.extend({}, c.get('attributes'), newColumn);
			c.set('attributes', attributes);
			return $q.when(c.save());
		}, function () {}).catch(function (err) {
			$scope.showError(err);
		});
	};

	$scope.addRow = function () {
		$scope.addingNewRow = true;
		$scope.newRowData = {};
	};

	$scope.inputTypes = ['text', 'number', 'checkbox', 'date', 'datetime', 'time'];
	$scope.getInputTypeForType = function (type) {
		if (type == 'integer') {
			return 'number';
		}
		if (type == 'boolean') {
			return 'checkbox';
		}
		if (type == 'date' || type == 'datetime' || type == 'time') {
			return type;
		}
		return 'text';
	};

	$scope.getInputTypeForColumn = function (columnName) {
		if (!columnName) return 'text';
		if (columnName == 'objectId') return 'text';
		if (columnName == 'createdAt' || columnName == 'updatedAt') return 'datetime';

		if (!$scope.openedClass) return 'text';
		var columnData = $scope.openedClass.get('attributes')[columnName];
		if (!columnData) {
			return 'text';
		}
		return $scope.getInputTypeForType(columnData.type);
	};

	$scope.saveNewRow = function (data) {
		var c = $scope.openedClass;
		var Row = Parse.Object.extend(c.get('name'));

		var row = new Row(data);

		var acl = new Parse.ACL();
		acl.setPublicReadAccess(true);
		acl.setPublicWriteAccess(true);
		row.setACL(acl);

		return $q.when(row.save()).then(function (row) {
			$scope.openedRows.push(row);
			$scope.addingNewRow = false;
		}, function (err) {
			$scope.showError(err);
		});
	};

	$scope.deleteRow = function (row) {
		if (!row) return;

		var index = $scope.openedRows.indexOf(row);
		$q.when(row.destroy()).then(function () {
			$scope.openedRows.splice(index, 1);
			$scope.activeRow = null;
		}, function (err) {
			$scope.showError(err);
		});
	};

	$scope.rowACLActions = ['read', 'write'];
	$scope.classACLActions = ['read', 'write', 'get', 'find', 'update', 'create', 'delete'];

	$scope.defaultRowACL = {
		'*': { read: true, write: true }
	};
	$scope.defaultClassACL = {
		'*': {
			// ACLs for the class row (in __Class)
			read: true,
			write: true,

			// ACLs for items in the class
			get: true,
			find: true,
			update: true,
			create: true,
			'delete': true
		}
	};

	$scope.changeClassACL = function () {
		var c = $scope.openedClass;
		var acl = c.getACL() || new Parse.ACL();

		var childScope = $scope.$new();
		childScope.actions = $scope.classACLActions;
		childScope.ACL = angular.merge({}, $scope.defaultClassACL, acl.permissionsById);

		var modal = $modal.open({
			templateUrl: 'change-acl-modal',
			scope: childScope,
			controller: 'ChangeACLCtrl'
		});

		modal.result.then(function (data) {
			acl.permissionsById = data;
			c.setACL(acl);
			return $q.when(c.save());
		}, function () {}).catch(function (err) {
			$scope.showError(err);
		});
	};

	$scope.changeRowACL = function (row) {
		var row = $scope.activeRow;
		var acl = row.getACL() || new Parse.ACL();

		var childScope = $scope.$new();
		childScope.actions = $scope.rowACLActions;
		childScope.ACL = angular.merge({}, $scope.defaultRowACL, acl.permissionsById);

		var modal = $modal.open({
			templateUrl: 'change-acl-modal',
			scope: childScope,
			controller: 'ChangeACLCtrl'
		});

		modal.result.then(function (data) {
			var acl = new Parse.ACL(data);
			row.setACL(acl);
			return $q.when(row.save());
		}, function () {}).catch(function (err) {
			$scope.showError(err);
		});
	};

	$scope.dropClass = function () {
		var c = $scope.openedClass;

		if (c.get('name')[0] == '_') {
			if (c.get('name')[1] == '_') {
				return $scope.showError('Cannot delete a system class.');
			}
			res = confirm('This will delete a base class. Do you want to continue?');
			if (!res) {
				return;
			}
		}

		var res = prompt('You are about to delete this class. To confirm, type the name of this class below:');
		if (res != c.get('name')) {
			return;
		}

		var index = $scope.classesList.indexOf(c);
		$q.when(c.destroy()).then(function () {
			$scope.classesList.splice(index, 1);
			$scope.selectFirstClass();
		}, function (err) {
			$scope.showError(err);
		});
	};
}]);

app.controller('ChangeACLCtrl', ['$scope', function ($scope) {
	$scope.addNewTarget = function (target) {
		$scope.ACL[target] = {};
		$scope.newTarget = '';
	};

	$scope.deleteTarget = function (target) {
		delete $scope.ACL[target];
	};
}]);

app.controller('RowFilterCtrl', ['$scope', function ($scope) {
	$scope.$watch('filteringRows', function (val) {
		if (val) {
			$scope.addConstraint();
		} else {
			for (var name in $scope.rowFilter) {
				delete $scope.rowFilter[name];
			}
		}
	});

	$scope.$watch('rowFilter', function (filter) {
		if (!$scope.openedClass) return;
		$scope.loadRows();
	}, true);

	$scope.addConstraint = function () {
		$scope.addingConstraint = true;
	};

	$scope.submitConstraint = function () {
		var name = $scope.newConstraintAttribute,
			val = $scope.newConstraintValue;

		if (!name) return;

		$scope.rowFilter[name] = val;

		$scope.addingConstraint = false;
	};

	$scope.removeConstraint = function (name) {
		delete $scope.rowFilter[name];
	};
}]);